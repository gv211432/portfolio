/**
 * POST /api/staff/auth/forgot-password
 * Body: { email }
 *
 * Pre-login password reset initiation.
 *
 * Rules:
 *   - Staff must have BOTH TOTP AND EMAIL_OTP enabled to self-reset.
 *   - If only one (or zero) 2FA methods enrolled:
 *       → { canReset: false, enrolledMethods: [] }
 *     UI must show "contact support" — self-service is impossible.
 *   - If both enrolled:
 *       → Send 6-digit OTP to the EMAIL_OTP target email (purpose "pwd_reset")
 *       → { canReset: true, maskedEmail }
 *     User then submits this code + their TOTP code + new password to /verify.
 *
 * No auth required (pre-login).
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateNumericOtp } from "@/lib/mail/text";
import { sendOtpCode } from "@/lib/mail/systemMail";

const OTP_TTL_MS  = 10 * 60_000; // 10 minutes
const OTP_RATE_MS = 60_000;       // cooldown between sends

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const staffAddr = await prisma.staffEmailAddress.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { staff: { include: { twoFactor: true } } },
    });

    if (!staffAddr || staffAddr.staff.status !== "ACTIVE") {
      // Always respond the same shape to prevent account enumeration
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ canReset: false, enrolledMethods: [] });
    }

    const { staff } = staffAddr;
    const factors = staff.twoFactor;

    const totpRec     = factors.find((f) => f.method === "TOTP"      && f.enabled && !!f.totpSecret);
    const emailOtpRec = factors.find((f) => f.method === "EMAIL_OTP" && f.enabled && f.otpTargetVerified && !!f.otpTargetEmail);

    const enrolledMethods: string[] = [
      ...(totpRec     ? ["TOTP"]      : []),
      ...(emailOtpRec ? ["EMAIL_OTP"] : []),
    ];

    if (!totpRec || !emailOtpRec) {
      // Cannot self-serve — UI must direct to contact support
      return NextResponse.json({ canReset: false, enrolledMethods });
    }

    // Rate-limit: 1 OTP send per minute
    const lastSent = emailOtpRec.pendingOtpPurpose === "pwd_reset" && emailOtpRec.pendingOtpExpires;
    if (lastSent && emailOtpRec.pendingOtpExpires!.getTime() > Date.now() + OTP_TTL_MS - OTP_RATE_MS) {
      const waitSec = Math.ceil(
        (emailOtpRec.pendingOtpExpires!.getTime() - OTP_TTL_MS + OTP_RATE_MS - Date.now()) / 1000
      );
      return NextResponse.json({ error: `Please wait ${waitSec}s before requesting another code.` }, { status: 429 });
    }

    const code = generateNumericOtp();
    const hash = await bcrypt.hash(code, 10);

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: staff.id, method: "EMAIL_OTP" } },
      data: {
        pendingOtpHash:    hash,
        pendingOtpExpires: new Date(Date.now() + OTP_TTL_MS),
        pendingOtpPurpose: "pwd_reset",
      },
    });

    const name = staff.displayName || `${staff.firstName} ${staff.lastName}`;
    await sendOtpCode({
      to:      emailOtpRec.otpTargetEmail!,
      toName:  name,
      code,
      purpose: "password_reset",
      staffId: staff.id,
    });

    const [local, domain] = emailOtpRec.otpTargetEmail!.split("@");
    const masked = local.slice(0, 2) + "•••@" + domain;

    return NextResponse.json({ canReset: true, maskedEmail: masked });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
