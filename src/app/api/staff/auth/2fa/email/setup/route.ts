/**
 * POST /api/staff/auth/2fa/email/setup
 * Body: { targetEmail? }  // defaults to staff's own mailbox address
 *
 * Generates an OTP, stores a bcrypt hash + 10-min expiry, emails the code.
 * Verify with /2fa/email/verify-setup to enable EMAIL_OTP.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { readStaffSession } from "@/lib/mail/staffAuth";
import { generateNumericOtp, isValidEmail } from "@/lib/mail/text";
import { sendOtpCode } from "@/lib/mail/systemMail";

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const ok = s.session.stage === "PENDING_2FA_SETUP" || s.session.stage === "ACTIVE";
    if (!ok) return NextResponse.json({ error: "Not allowed in current stage" }, { status: 409 });

    const body = await req.json().catch(() => ({}));
    const addr = await prisma.staffEmailAddress.findUnique({ where: { staffId: s.staff.id } });
    const target = (typeof body.targetEmail === "string" && body.targetEmail.trim())
      ? body.targetEmail.trim().toLowerCase()
      : (addr?.email ?? s.staff.recoveryEmail);

    if (!isValidEmail(target)) {
      return NextResponse.json({ error: "Invalid target email" }, { status: 400 });
    }

    const code = generateNumericOtp();
    const hash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 10 * 60_000);

    await prisma.staffTwoFactor.upsert({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
      update: {
        otpTargetEmail: target,
        otpTargetVerified: false,
        pendingOtpHash: hash,
        pendingOtpExpires: expires,
        pendingOtpPurpose: "setup",
      },
      create: {
        staffId: s.staff.id,
        method: "EMAIL_OTP",
        enabled: false,
        otpTargetEmail: target,
        otpTargetVerified: false,
        pendingOtpHash: hash,
        pendingOtpExpires: expires,
        pendingOtpPurpose: "setup",
      },
    });

    await sendOtpCode({
      to: target,
      toName: `${s.staff.firstName} ${s.staff.lastName}`,
      code,
      purpose: "setup",
      staffId: s.staff.id,
    });

    return NextResponse.json({ ok: true, targetEmail: target });
  } catch (err) {
    console.error("[staff/email-otp/setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
