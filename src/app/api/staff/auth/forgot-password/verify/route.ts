/**
 * POST /api/staff/auth/forgot-password/verify
 * Body: { email, emailOtpCode, totpCode, newPassword }
 *
 * Verifies BOTH factors before resetting the password:
 *   1. EMAIL_OTP code — matched against pending "pwd_reset" OTP in StaffTwoFactor
 *   2. TOTP code      — verified against the stored TOTP secret
 *
 * Both must pass. Either failure returns 401.
 * No auth required (pre-login).
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/mail/staffAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, emailOtpCode, totpCode, newPassword } = await req.json();

    if (
      typeof email        !== "string" ||
      typeof emailOtpCode !== "string" ||
      typeof totpCode     !== "string" ||
      typeof newPassword  !== "string"
    ) {
      return NextResponse.json({ error: "email, emailOtpCode, totpCode and newPassword are all required" }, { status: 400 });
    }

    if (newPassword.length < 10) return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
    if (newPassword.length > 256) return NextResponse.json({ error: "Password too long" }, { status: 400 });

    const staffAddr = await prisma.staffEmailAddress.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { staff: { include: { twoFactor: true } } },
    });

    if (!staffAddr || staffAddr.staff.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { staff } = staffAddr;
    const factors = staff.twoFactor;

    // ── Verify EMAIL_OTP ──────────────────────────────────────────────────────
    const emailRec = factors.find((f) => f.method === "EMAIL_OTP" && f.enabled);
    if (!emailRec?.pendingOtpHash || emailRec.pendingOtpPurpose !== "pwd_reset") {
      return NextResponse.json({ error: "No reset code found. Request a new one." }, { status: 400 });
    }
    if (!emailRec.pendingOtpExpires || emailRec.pendingOtpExpires < new Date()) {
      // Clear expired OTP
      await prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: staff.id, method: "EMAIL_OTP" } },
        data: { pendingOtpHash: null, pendingOtpExpires: null, pendingOtpPurpose: null },
      });
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 401 });
    }

    const emailOtpValid = await bcrypt.compare(emailOtpCode.trim(), emailRec.pendingOtpHash);
    if (!emailOtpValid) {
      return NextResponse.json({ error: "Invalid email code." }, { status: 401 });
    }

    // ── Verify TOTP ───────────────────────────────────────────────────────────
    const totpRec = factors.find((f) => f.method === "TOTP" && f.enabled && f.totpSecret);
    if (!totpRec?.totpSecret) {
      return NextResponse.json({ error: "Authenticator not set up." }, { status: 400 });
    }

    const totpValid = speakeasy.totp.verify({
      secret:   totpRec.totpSecret,
      encoding: "base32",
      token:    totpCode.trim().replace(/\s/g, ""),
      window:   1,
    });
    if (!totpValid) {
      return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
    }

    // ── Both factors verified — reset password ────────────────────────────────
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.staff.update({
        where: { id: staff.id },
        data: { passwordHash, mustResetPassword: false },
      }),
      // Clear the used OTP
      prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: staff.id, method: "EMAIL_OTP" } },
        data: { pendingOtpHash: null, pendingOtpExpires: null, pendingOtpPurpose: null },
      }),
      // Revoke all active sessions for security
      prisma.staffSession.updateMany({
        where: { staffId: staff.id, revokedAt: null },
        data:  { revokedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password/verify]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
