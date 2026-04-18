/**
 * POST /api/staff/auth/2fa/email/disable
 *
 * Disables Email OTP for the current staff member. Requires ACTIVE session.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveStaff, clientIp } from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    await prisma.staffTwoFactor.updateMany({
      where: { staffId: s.staff.id, method: "EMAIL_OTP" },
      data: { enabled: false, otpTargetVerified: false },
    });

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffEmailOtpDisabled,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[staff/email-otp/disable]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
