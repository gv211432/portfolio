/**
 * POST /api/admin/profile/reset-totp
 * In-session. Verify identity to initiate TOTP reset.
 * Two verification paths:
 *   A) email OTP + password
 *   B) TOTP recovery code + (email OTP OR password)
 * Returns a setupToken to begin the standard TOTP setup flow.
 * Body: { password?, emailOtp?, recoveryCode? }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin, signSetupToken } from "@/lib/adminAuth";
import { verifyAdminOtp } from "@/lib/admin/adminOtp";

type RecoveryCode = { hash: string; used: boolean };

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, emailOtp, recoveryCode } = await req.json();

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { passwordHash: true, recoveryCodes: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Path A: email OTP + password
  if (emailOtp && password) {
    const pwValid = await bcrypt.compare(password, admin.passwordHash);
    if (!pwValid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    const otpResult = await verifyAdminOtp(session.id, emailOtp.trim(), "change_password");
    if (otpResult === "expired") return NextResponse.json({ error: "Email code expired. Request a new one." }, { status: 400 });
    if (otpResult === "locked")  return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    if (otpResult === "invalid") return NextResponse.json({ error: "Invalid email code" }, { status: 400 });

    const setupToken = await signSetupToken(session.id);
    return NextResponse.json({ setupToken });
  }

  // Path B: recovery code + (email OTP OR password)
  if (recoveryCode) {
    // Verify recovery code
    let usedIndex = -1;
    if (admin.recoveryCodes) {
      const codes = admin.recoveryCodes as RecoveryCode[];
      for (let i = 0; i < codes.length; i++) {
        if (!codes[i].used && await bcrypt.compare(recoveryCode.trim(), codes[i].hash)) {
          usedIndex = i;
          break;
        }
      }
    }
    if (usedIndex === -1) return NextResponse.json({ error: "Invalid recovery code" }, { status: 401 });

    // Plus email OTP OR password
    let secondFactorValid = false;
    if (emailOtp) {
      const otpResult = await verifyAdminOtp(session.id, emailOtp.trim(), "change_password");
      secondFactorValid = otpResult === "ok";
      if (!secondFactorValid) {
        return NextResponse.json({ error: otpResult === "expired" ? "Email code expired" : otpResult === "locked" ? "Too many attempts" : "Invalid email code" }, { status: 400 });
      }
    } else if (password) {
      secondFactorValid = await bcrypt.compare(password, admin.passwordHash);
      if (!secondFactorValid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    } else {
      return NextResponse.json({ error: "Recovery code requires email OTP or password as second factor" }, { status: 400 });
    }

    // Mark recovery code as used
    const codes = admin.recoveryCodes as RecoveryCode[];
    codes[usedIndex].used = true;
    await prisma.adminUser.update({ where: { id: session.id }, data: { recoveryCodes: codes } });

    const setupToken = await signSetupToken(session.id);
    return NextResponse.json({ setupToken });
  }

  return NextResponse.json({ error: "Provide: (emailOtp + password) OR (recoveryCode + emailOtp/password)" }, { status: 400 });
}
