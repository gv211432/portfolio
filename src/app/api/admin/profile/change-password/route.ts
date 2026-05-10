/**
 * POST /api/admin/profile/change-password
 * In-session. Verifies TOTP + email OTP before setting new password.
 * Body: { totpCode, emailOtp, newPassword }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { requireAdmin } from "@/lib/adminAuth";
import { verifyAdminOtp } from "@/lib/admin/adminOtp";

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { totpCode, emailOtp, newPassword } = await req.json();
  if (!totpCode || !emailOtp || !newPassword) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  // Verify TOTP
  const totpValid = admin?.totpEnabled && admin.totpSecret
    ? speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: totpCode.trim(), window: 1 })
    : false;
  if (!totpValid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

  // Verify email OTP
  const otpResult = await verifyAdminOtp(session.id, emailOtp.trim(), "change_password");
  if (otpResult === "expired") return NextResponse.json({ error: "Email code expired. Request a new one." }, { status: 400 });
  if (otpResult === "locked")  return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  if (otpResult === "invalid") return NextResponse.json({ error: "Invalid email code" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({ where: { id: session.id }, data: { passwordHash: hash } });

  return NextResponse.json({ success: true });
}
