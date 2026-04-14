/**
 * POST /api/staff/auth/logout — revokes current session + clears cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  readStaffSession,
  revokeSession,
  clearStaffCookie,
  clientIp,
} from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  const s = await readStaffSession(req);
  if (s) {
    await revokeSession(s.session.id);
    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffLogout,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });
  }
  return clearStaffCookie(NextResponse.json({ ok: true }));
}
