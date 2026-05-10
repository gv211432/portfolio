/**
 * POST /api/admin/auth/verify-setup-email
 * First-login flow: verify OTP sent to recovery email, mark email as verified.
 * Auth: emailSetupToken in body.
 * Body: { emailSetupToken, email, otp }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyEmailSetupToken, signAdminToken, setAdminCookie } from "@/lib/adminAuth";
import { verifyAdminOtp } from "@/lib/admin/adminOtp";

export async function POST(req: NextRequest) {
  const { emailSetupToken, email, otp } = await req.json();

  const adminId = await verifyEmailSetupToken(emailSetupToken);
  if (!adminId) {
    return NextResponse.json({ error: "Invalid or expired setup token" }, { status: 401 });
  }

  if (!otp || !email) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const result = await verifyAdminOtp(adminId, otp.trim(), "setup_email");

  if (result === "expired")      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  if (result === "locked")       return NextResponse.json({ error: "Too many failed attempts. Request a new code." }, { status: 429 });
  if (result === "invalid")      return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  // Mark recovery email as verified and issue full session
  const admin = await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      recoveryEmail:         email.trim().toLowerCase(),
      recoveryEmailVerified: true,
      lastLoginAt:           new Date(),
    },
    select: { id: true, username: true },
  });

  const token    = await signAdminToken({ id: admin.id, username: admin.username });
  const response = NextResponse.json({ success: true, username: admin.username });
  return setAdminCookie(response, token);
}
