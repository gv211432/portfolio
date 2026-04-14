/**
 * POST /api/staff/auth/reset-password
 * Body: { newPassword }
 *
 * Allowed only when session.stage === PENDING_PASSWORD_RESET.
 * Updates password, clears mustResetPassword, advances session stage.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  readStaffSession,
  hashPassword,
  updateSessionStage,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    if (s.session.stage !== "PENDING_PASSWORD_RESET") {
      return NextResponse.json({ error: "Not in password-reset stage" }, { status: 409 });
    }

    const { newPassword } = await req.json();
    if (typeof newPassword !== "string" || newPassword.length < 10) {
      return NextResponse.json(
        { error: "Password must be at least 10 characters" },
        { status: 400 },
      );
    }
    if (newPassword.length > 256) {
      return NextResponse.json({ error: "Password too long" }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    await prisma.staff.update({
      where: { id: s.staff.id },
      data: { passwordHash: hash, mustResetPassword: false },
    });

    const nextStage = await computeNextStage(s.staff.id, new Set());
    await updateSessionStage(s.session.id, nextStage);

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffPasswordReset,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ nextStep: nextStage });
  } catch (err) {
    console.error("[staff/reset-password]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
