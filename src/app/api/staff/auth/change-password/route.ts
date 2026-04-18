/**
 * POST /api/staff/auth/change-password
 * Body: { currentPassword, newPassword }
 *
 * Changes password from an ACTIVE session (differs from reset-password which
 * operates from PENDING_PASSWORD_RESET stage).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireActiveStaff,
  hashPassword,
  verifyPassword,
  clientIp,
} from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Both currentPassword and newPassword required" }, { status: 400 });
    }

    const valid = await verifyPassword(currentPassword, s.staff.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    if (newPassword.length < 10) {
      return NextResponse.json({ error: "New password must be at least 10 characters" }, { status: 400 });
    }
    if (newPassword.length > 256) {
      return NextResponse.json({ error: "Password too long" }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    await prisma.staff.update({ where: { id: s.staff.id }, data: { passwordHash: hash } });

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffPasswordReset,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[staff/change-password]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
