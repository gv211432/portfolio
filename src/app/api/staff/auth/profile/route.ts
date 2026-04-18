/**
 * PATCH /api/staff/auth/profile
 * Body: { firstName?, lastName?, displayName?, recoveryEmail? }
 *
 * Updates staff profile fields. Requires an ACTIVE session.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveStaff, clientIp } from "@/lib/mail/staffAuth";
import { isValidEmail } from "@/lib/mail/text";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function PATCH(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await req.json();
    const update: Record<string, string> = {};

    if (typeof body.firstName === "string") {
      const v = body.firstName.trim();
      if (!v) return NextResponse.json({ error: "First name cannot be empty" }, { status: 400 });
      update.firstName = v;
    }
    if (typeof body.lastName === "string") {
      const v = body.lastName.trim();
      if (!v) return NextResponse.json({ error: "Last name cannot be empty" }, { status: 400 });
      update.lastName = v;
    }
    if (typeof body.displayName === "string") {
      update.displayName = body.displayName.trim() || `${s.staff.firstName} ${s.staff.lastName}`;
    }
    if (typeof body.recoveryEmail === "string") {
      const v = body.recoveryEmail.trim().toLowerCase();
      if (!isValidEmail(v)) return NextResponse.json({ error: "Invalid recovery email" }, { status: 400 });
      update.recoveryEmail = v;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await prisma.staff.update({ where: { id: s.staff.id }, data: update });

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: "staff.profile.update",
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
      metadata: { fields: Object.keys(update) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[staff/profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
