/**
 * PUT /api/admin/staff/[id]/policy
 * Body: { allowedDomainsOverride: string[] | null }
 *
 * null      → fall back to global policy
 * string[]  → replaces global for this staff (empty array = lockdown)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { Prisma } from "@prisma/client";
import { logActivity, Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

function normalize(list: unknown): string[] | null {
  if (list === null) return null;
  if (!Array.isArray(list)) return null;
  return list
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.toLowerCase().trim())
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json();
  const raw = body?.allowedDomainsOverride;
  const next = raw === null ? null : normalize(raw);

  if (raw !== null && next === null) {
    return NextResponse.json({ error: "Invalid allowedDomainsOverride" }, { status: 400 });
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: { allowedDomainsOverride: next === null ? Prisma.JsonNull : (next as Prisma.InputJsonValue) },
    select: { id: true, allowedDomainsOverride: true },
  });

  await logActivity({
    actorType: "ADMIN",
    actorId: admin.id,
    actorLabel: admin.username,
    action: Activity.AdminPolicyStaffUpdate,
    targetType: "Staff",
    targetId: id,
    metadata: { allowedDomainsOverride: next },
  });

  return NextResponse.json({ allowedDomainsOverride: updated.allowedDomainsOverride });
}
