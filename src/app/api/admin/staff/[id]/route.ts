/**
 * GET    /api/admin/staff/[id]   — full staff detail (profile + 2fa + policy)
 * PATCH  /api/admin/staff/[id]   — update profile fields
 * DELETE /api/admin/staff/[id]   — offboard (soft: set status=OFFBOARDED, revokes sessions)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { logActivity, Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const perm = await requirePermission(req, "staff.read");
  if (!perm.ok) return perm.response;
  const { id } = await ctx.params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { emailAddress: true, twoFactor: true },
  });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    staff: {
      ...staff,
      passwordHash: undefined,
      email: staff.emailAddress?.email ?? null,
      twoFactor: staff.twoFactor.map((f) => ({
        method: f.method,
        enabled: f.enabled,
        otpTargetEmail: f.method === "EMAIL_OTP" ? f.otpTargetEmail : undefined,
        otpTargetVerified: f.otpTargetVerified,
      })),
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const perm = await requirePermission(req, "staff.update");
  if (!perm.ok) return perm.response;
  const { id } = await ctx.params;

  const body = await req.json();
  const allowed = [
    "firstName","lastName","displayName","phone","role","employeeCode",
    "dateOfBirth","joinedAt","profileImageUrl","recoveryEmail","status",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (key === "dateOfBirth" || key === "joinedAt") {
      data[key] = body[key] ? new Date(body[key]) : null;
    } else {
      data[key] = body[key];
    }
  }

  const updated = await prisma.staff.update({ where: { id }, data });

  // If suspending/offboarding, revoke all active sessions.
  if (data.status && data.status !== "ACTIVE") {
    await prisma.staffSession.updateMany({
      where: { staffId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await logActivity({
    actorType: "ADMIN",
    actorId: perm.user.id,
    actorLabel: perm.user.username,
    action: Activity.AdminStaffUpdate,
    targetType: "Staff",
    targetId: id,
    metadata: { changedFields: Object.keys(data) },
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim(),
  });

  return NextResponse.json({ staff: { ...updated, passwordHash: undefined } });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const perm = await requirePermission(req, "staff.delete");
  if (!perm.ok) return perm.response;
  const { id } = await ctx.params;

  await prisma.staff.update({ where: { id }, data: { status: "OFFBOARDED" } });
  await prisma.staffSession.updateMany({
    where: { staffId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logActivity({
    actorType: "ADMIN",
    actorId: perm.user.id,
    actorLabel: perm.user.username,
    action: Activity.AdminStaffSuspend,
    targetType: "Staff",
    targetId: id,
    metadata: { to: "OFFBOARDED" },
  });

  return NextResponse.json({ ok: true });
}
