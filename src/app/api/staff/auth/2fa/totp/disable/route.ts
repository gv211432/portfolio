/**
 * POST /api/staff/auth/2fa/totp/disable
 *
 * Disables TOTP for the current staff member. Requires ACTIVE session.
 * Also revokes all trusted devices — since trust is premised on having TOTP,
 * disabling TOTP means future logins must go through full 2FA again.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveStaff, clientIp } from "@/lib/mail/staffAuth";
import { revokeAllTrustedDevices } from "@/lib/mail/staffDevice";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    await prisma.staffTwoFactor.updateMany({
      where: { staffId: s.staff.id, method: "TOTP" },
      data:  { enabled: false, totpSecret: null, recoveryCodes: null as any },
    });

    // Revoke all trusted devices — trust was conditional on TOTP existing
    const res = NextResponse.json({ ok: true });
    await revokeAllTrustedDevices(s.staff.id, res);

    await logActivity({
      actorType: "STAFF",
      actorId:   s.staff.id,
      action:    Activity.StaffTotpDisabled,
      metadata:  { trustedDevicesRevoked: true },
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return res;
  } catch (err) {
    console.error("[staff/totp/disable]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
