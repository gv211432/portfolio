/**
 * POST /api/staff/auth/2fa/email/verify-setup
 * Body: { code }
 *
 * Confirms the OTP, marks target verified, flips enabled=true, and advances
 * session stage if the staff was in PENDING_2FA_SETUP.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  readStaffSession,
  updateSessionStage,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { code } = await req.json();
    if (typeof code !== "string") {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const rec = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
    });
    if (!rec?.pendingOtpHash || rec.pendingOtpPurpose !== "setup") {
      return NextResponse.json({ error: "No setup OTP pending" }, { status: 409 });
    }
    if (!rec.pendingOtpExpires || rec.pendingOtpExpires < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 401 });
    }

    const ok = await bcrypt.compare(code.trim(), rec.pendingOtpHash);
    if (!ok) return NextResponse.json({ error: "Invalid code" }, { status: 401 });

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: s.staff.id, method: "EMAIL_OTP" } },
      data: {
        enabled: true,
        otpTargetVerified: true,
        pendingOtpHash: null,
        pendingOtpExpires: null,
        pendingOtpPurpose: null,
      },
    });

    let nextStep: string | null = null;
    if (s.session.stage === "PENDING_2FA_SETUP") {
      const next = await computeNextStage(s.staff.id, new Set());
      await updateSessionStage(s.session.id, next);
      nextStep = next;
    }

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffEmailOtpEnabled,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, nextStep });
  } catch (err) {
    console.error("[staff/email-otp/verify-setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
