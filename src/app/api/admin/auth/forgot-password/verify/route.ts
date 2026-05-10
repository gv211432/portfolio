/**
 * POST /api/admin/auth/forgot-password/verify
 * Public — no session required.
 * Body: { username, totpOrRecovery, emailOtp }
 *   totpOrRecovery — either a 6-digit TOTP code OR one of the 8 bcrypt recovery codes
 *   emailOtp       — 6-digit code sent to recovery email
 * Returns: { resetToken } — short-lived JWT for the password-reset step.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { signPasswordResetToken } from "@/lib/adminAuth";
import { verifyAdminOtp } from "@/lib/admin/adminOtp";

type RecoveryCode = { hash: string; used: boolean };

export async function POST(req: NextRequest) {
  const { username, totpOrRecovery, emailOtp } = await req.json();

  if (!username || !totpOrRecovery || !emailOtp) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username: username.trim() },
    select: {
      id: true, isActive: true,
      totpSecret: true, recoveryCodes: true,
      recoveryEmailVerified: true,
    },
  });

  if (!admin || !admin.isActive || !admin.recoveryEmailVerified) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const code = String(totpOrRecovery).trim().replace(/\s/g, "");

  // Verify TOTP or recovery code
  const totpValid = admin.totpSecret
    ? speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: code, window: 1 })
    : false;

  let usedRecoveryIndex = -1;
  if (!totpValid && admin.recoveryCodes) {
    const codes = admin.recoveryCodes as RecoveryCode[];
    for (let i = 0; i < codes.length; i++) {
      if (!codes[i].used && await bcrypt.compare(code, codes[i].hash)) {
        usedRecoveryIndex = i;
        break;
      }
    }
  }

  if (!totpValid && usedRecoveryIndex === -1) {
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
  }

  // Verify email OTP
  const otpResult = await verifyAdminOtp(admin.id, emailOtp.trim(), "forgot_password");
  if (otpResult === "expired") return NextResponse.json({ error: "Email code expired. Start over." }, { status: 400 });
  if (otpResult === "locked")  return NextResponse.json({ error: "Too many attempts. Start over." }, { status: 429 });
  if (otpResult === "invalid") return NextResponse.json({ error: "Invalid email code" }, { status: 400 });

  // Both verified — mark recovery code used if applicable
  if (usedRecoveryIndex !== -1) {
    const codes = admin.recoveryCodes as RecoveryCode[];
    codes[usedRecoveryIndex].used = true;
    await prisma.adminUser.update({ where: { id: admin.id }, data: { recoveryCodes: codes } });
  }

  const resetToken = await signPasswordResetToken(admin.id);
  return NextResponse.json({ resetToken });
}
