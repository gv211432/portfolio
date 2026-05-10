/**
 * 2FA login challenge — unified endpoint for both TOTP and EMAIL_OTP.
 *
 *   GET  /api/staff/auth/2fa/challenge
 *     When stage = PENDING_EMAIL_OTP, triggers sending an OTP to the verified
 *     target email. Idempotent: only sends if none pending or expired.
 *     Returns { method, targetHint } so the UI knows what to ask.
 *
 *   POST /api/staff/auth/2fa/challenge
 *     Body: { code }
 *     Validates code against the current stage's method (TOTP or EMAIL_OTP),
 *     advances session to the next factor or ACTIVE.
 *
 * Login chain: PENDING_TOTP → PENDING_EMAIL_OTP → ACTIVE  (only enabled factors
 * appear in the chain; computeNextStage filters them.)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import {
  readStaffSession,
  updateSessionStage,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { generateNumericOtp } from "@/lib/mail/text";
import { sendOtpCode } from "@/lib/mail/systemMail";
import { sendWelcomeEmailIfFirst } from "@/lib/mail/staffWelcome";
import { logActivity, Activity } from "@/lib/mail/activity";
import type { SessionStage } from "@prisma/client";

function stageToStep(stage: SessionStage): string {
  return stage === "ACTIVE" ? "DONE"
    : stage === "PENDING_TOTP" ? "TOTP"
    : stage === "PENDING_EMAIL_OTP" ? "EMAIL_OTP"
    : stage === "PENDING_PASSWORD_RESET" ? "PASSWORD_RESET"
    : "2FA_SETUP";
}

export async function GET(req: NextRequest) {
  const s = await readStaffSession(req);
  if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (s.session.stage === "PENDING_EMAIL_OTP") {
    const rec = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
    });
    if (!rec?.enabled || !rec.otpTargetEmail) {
      return NextResponse.json({ error: "EMAIL_OTP not enabled" }, { status: 409 });
    }

    const needsNew =
      !rec.pendingOtpHash ||
      rec.pendingOtpPurpose !== "login" ||
      !rec.pendingOtpExpires ||
      rec.pendingOtpExpires < new Date();

    if (needsNew) {
      const code = generateNumericOtp();
      const hash = await bcrypt.hash(code, 10);
      await prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
        data: {
          pendingOtpHash: hash,
          pendingOtpExpires: new Date(Date.now() + 10 * 60_000),
          pendingOtpPurpose: "login",
        },
      });
      await sendOtpCode({
        to: rec.otpTargetEmail,
        toName: `${s.staff.firstName} ${s.staff.lastName}`,
        code,
        purpose: "login",
        staffId: s.staff.id,
      });
    }

    const hint = rec.otpTargetEmail.replace(/^(.{2}).*(@.*)$/, "$1•••$2");
    return NextResponse.json({ method: "EMAIL_OTP", targetHint: hint });
  }

  if (s.session.stage === "PENDING_TOTP") {
    return NextResponse.json({ method: "TOTP" });
  }

  return NextResponse.json({ error: "Not in a 2FA stage" }, { status: 409 });
}

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { code } = await req.json();
    if (typeof code !== "string") {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const passed = new Set<string>();
    let methodUsed: "TOTP" | "EMAIL_OTP";

    if (s.session.stage === "PENDING_TOTP") {
      methodUsed = "TOTP";
      const rec = await prisma.staffTwoFactor.findUnique({
        where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
      });
      if (!rec?.enabled || !rec.totpSecret) {
        return NextResponse.json({ error: "TOTP not enabled" }, { status: 409 });
      }
      const valid = speakeasy.totp.verify({
        secret: rec.totpSecret,
        encoding: "base32",
        token: code.trim(),
        window: 1,
      });
      if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 401 });
      passed.add("TOTP");
    } else if (s.session.stage === "PENDING_EMAIL_OTP") {
      methodUsed = "EMAIL_OTP";
      const rec = await prisma.staffTwoFactor.findUnique({
        where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
      });
      if (!rec?.pendingOtpHash || rec.pendingOtpPurpose !== "login") {
        return NextResponse.json({ error: "No OTP pending — request a new one" }, { status: 409 });
      }
      if (!rec.pendingOtpExpires || rec.pendingOtpExpires < new Date()) {
        return NextResponse.json({ error: "Code expired" }, { status: 401 });
      }
      const ok = await bcrypt.compare(code.trim(), rec.pendingOtpHash);
      if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 401 });

      await prisma.staffTwoFactor.update({
        where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
        data: { pendingOtpHash: null, pendingOtpExpires: null, pendingOtpPurpose: null },
      });
      passed.add("TOTP"); // TOTP either didn't exist or was already passed (we're past it)
      passed.add("EMAIL_OTP");
    } else {
      return NextResponse.json({ error: "Not in a 2FA stage" }, { status: 409 });
    }

    const nextStage = await computeNextStage(s.staff.id, passed);
    await updateSessionStage(s.session.id, nextStage);
    if (nextStage === "ACTIVE") void sendWelcomeEmailIfFirst(s.staff.id);

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: "staff.2fa.challenge.passed",
      metadata: { method: methodUsed, nextStage },
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    if (nextStage === "ACTIVE") {
      await logActivity({
        actorType: "STAFF",
        actorId: s.staff.id,
        action: Activity.StaffLoginSuccess,
        metadata: { fullyAuthenticated: true },
        ipAddress: clientIp(req),
        userAgent: req.headers.get("user-agent"),
      });
    }

    return NextResponse.json({ nextStep: stageToStep(nextStage) });
  } catch (err) {
    console.error("[staff/2fa/challenge]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
