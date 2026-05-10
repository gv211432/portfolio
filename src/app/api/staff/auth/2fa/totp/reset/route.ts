/**
 * TOTP reset — two-step flow for staff who have lost access to their authenticator.
 * Requires ACTIVE session.
 *
 * Verification: current password + EMAIL_OTP code.
 * (Since TOTP is what is being reset, TOTP cannot be used to verify the reset.)
 *
 * Step 1 — GET: Send OTP to EMAIL_OTP target email (purpose "totp_reset").
 *   Returns { sent: true, maskedEmail }
 *
 * Step 2 — POST: Verify password + email OTP code → disable TOTP.
 *   Body: { currentPassword, emailOtpCode }
 *   Returns { ok: true } — staff must then re-enroll TOTP via the 2FA setup flow.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireActiveStaff, verifyPassword, clientIp } from "@/lib/mail/staffAuth";
import { generateNumericOtp } from "@/lib/mail/text";
import { sendOtpCode } from "@/lib/mail/systemMail";
import { logActivity, Activity } from "@/lib/mail/activity";

const OTP_TTL_MS  = 10 * 60_000;
const OTP_RATE_MS = 60_000;

/** GET — send OTP to EMAIL_OTP target email */
export async function GET(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const emailRec = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
    });

    if (!emailRec?.enabled || !emailRec.otpTargetVerified || !emailRec.otpTargetEmail) {
      return NextResponse.json({
        error: "Email OTP (2FA) must be enabled to reset your authenticator app. Contact support if both are unavailable.",
      }, { status: 400 });
    }

    // Rate-limit
    if (
      emailRec.pendingOtpPurpose === "totp_reset" &&
      emailRec.pendingOtpExpires &&
      emailRec.pendingOtpExpires.getTime() > Date.now() + OTP_TTL_MS - OTP_RATE_MS
    ) {
      const waitSec = Math.ceil(
        (emailRec.pendingOtpExpires.getTime() - OTP_TTL_MS + OTP_RATE_MS - Date.now()) / 1000
      );
      return NextResponse.json({ error: `Please wait ${waitSec}s before requesting another code.` }, { status: 429 });
    }

    const code = generateNumericOtp();
    const hash = await bcrypt.hash(code, 10);

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
      data: {
        pendingOtpHash:    hash,
        pendingOtpExpires: new Date(Date.now() + OTP_TTL_MS),
        pendingOtpPurpose: "totp_reset",
      },
    });

    const name = s.staff.displayName || `${s.staff.firstName} ${s.staff.lastName}`;
    await sendOtpCode({
      to:      emailRec.otpTargetEmail,
      toName:  name,
      code,
      purpose: "totp_reset",
      staffId: s.staff.id,
    });

    const [local, domain] = emailRec.otpTargetEmail.split("@");
    const masked = local.slice(0, 2) + "•••@" + domain;

    return NextResponse.json({ sent: true, maskedEmail: masked });
  } catch (err) {
    console.error("[totp/reset GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST — verify password + email OTP → disable TOTP */
export async function POST(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { currentPassword, emailOtpCode } = await req.json();

    if (typeof currentPassword !== "string" || typeof emailOtpCode !== "string") {
      return NextResponse.json({ error: "currentPassword and emailOtpCode are required" }, { status: 400 });
    }

    // Verify current password
    const pwValid = await verifyPassword(currentPassword, s.staff.passwordHash);
    if (!pwValid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

    // Verify email OTP
    const emailRec = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
    });

    if (!emailRec?.pendingOtpHash || emailRec.pendingOtpPurpose !== "totp_reset") {
      return NextResponse.json({ error: "No code found — request a new one first." }, { status: 400 });
    }
    if (!emailRec.pendingOtpExpires || emailRec.pendingOtpExpires < new Date()) {
      await prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
        data: { pendingOtpHash: null, pendingOtpExpires: null, pendingOtpPurpose: null },
      });
      return NextResponse.json({ error: "Code expired — request a new one." }, { status: 401 });
    }

    const otpValid = await bcrypt.compare(emailOtpCode.trim(), emailRec.pendingOtpHash);
    if (!otpValid) return NextResponse.json({ error: "Invalid code." }, { status: 401 });

    // Both verified — disable TOTP (wipe secret so they must re-enroll)
    await prisma.$transaction([
      prisma.staffTwoFactor.updateMany({
        where: { staffId: s.staff.id, method: "TOTP" },
        data:  { enabled: false, totpSecret: null },
      }),
      // Clear used OTP
      prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
        data:  { pendingOtpHash: null, pendingOtpExpires: null, pendingOtpPurpose: null },
      }),
    ]);

    await logActivity({
      actorType: "STAFF",
      actorId:   s.staff.id,
      action:    Activity.StaffTotpDisabled,
      metadata:  { reason: "self_reset_via_password_and_email_otp" },
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[totp/reset POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
