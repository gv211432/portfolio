/**
 * Resolves the "mail actor" for mailbox routes.
 *
 * Two legitimate callers on /api/mail/*:
 *   - a fully authenticated staff (reading their own mailbox)
 *   - an admin impersonating via ?asStaffId=<id>  (read/write with audit logging)
 *
 * Returns the effective staffId plus a flag so callers can log impersonation.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActiveStaff, clientIp } from "@/lib/mail/staffAuth";
import { requireAdmin } from "@/lib/adminAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

export interface MailActor {
  staffId: string;
  viewingAsAdmin: boolean;
  adminId?: string;
  adminUsername?: string;
  staffSessionId?: string;
  ip: string | null;
  userAgent: string | null;
}

export async function resolveMailActor(req: NextRequest): Promise<
  { ok: true; actor: MailActor } | { ok: false; response: NextResponse }
> {
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent");

  const asStaffId = new URL(req.url).searchParams.get("asStaffId");

  if (asStaffId) {
    const admin = await requireAdmin(req);
    if (!admin) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Admin auth required" }, { status: 401 }),
      };
    }
    const staff = await prisma.staff.findUnique({ where: { id: asStaffId } });
    if (!staff) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Staff not found" }, { status: 404 }),
      };
    }
    return {
      ok: true,
      actor: {
        staffId: asStaffId,
        viewingAsAdmin: true,
        adminId: admin.id,
        adminUsername: admin.username,
        ip,
        userAgent: ua,
      },
    };
  }

  const r = await requireActiveStaff(req);
  if (!r) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    actor: {
      staffId: r.staff.id,
      viewingAsAdmin: false,
      staffSessionId: r.session.id,
      ip,
      userAgent: ua,
    },
  };
}

/** Convenience: log an action as the correct actor type. */
export async function logAsActor(
  actor: MailActor,
  action: string,
  opts: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  await logActivity({
    actorType: actor.viewingAsAdmin ? "ADMIN" : "STAFF",
    actorId: actor.viewingAsAdmin ? actor.adminId : actor.staffId,
    actorLabel: actor.viewingAsAdmin ? actor.adminUsername : undefined,
    action,
    targetType: opts.targetType,
    targetId: opts.targetId,
    metadata: {
      ...opts.metadata,
      ...(actor.viewingAsAdmin ? { impersonatedStaffId: actor.staffId } : {}),
    },
    ipAddress: actor.ip,
    userAgent: actor.userAgent,
  });
}

/** Guard: admin-impersonation reads must be audit-logged automatically. */
export async function logImpersonationViewIfAny(actor: MailActor, targetId: string, kind: string): Promise<void> {
  if (!actor.viewingAsAdmin) return;
  await logActivity({
    actorType: "ADMIN",
    actorId: actor.adminId,
    actorLabel: actor.adminUsername,
    action: kind === "email" ? Activity.AdminImpersonateEmailOpen : Activity.AdminImpersonateView,
    targetType: kind === "email" ? "Email" : "Staff",
    targetId,
    metadata: { impersonatedStaffId: actor.staffId },
    ipAddress: actor.ip,
    userAgent: actor.userAgent,
  });
}
