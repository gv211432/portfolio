/**
 * GET /api/admin/policy/global   — fetch (creates row on first read)
 * PUT /api/admin/policy/global   — body: { allowedDomains: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { logActivity, Activity } from "@/lib/mail/activity";

function normalize(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(
    list
      .filter((d): d is string => typeof d === "string")
      .map((d) => d.toLowerCase().trim())
      .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)),
  ));
}

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "mail_policy.read");
  if (!perm.ok) return perm.response;

  const row = await prisma.globalPolicy.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", allowedDomains: [] },
  });
  return NextResponse.json({ allowedDomains: row.allowedDomains, updatedAt: row.updatedAt });
}

export async function PUT(req: NextRequest) {
  const perm = await requirePermission(req, "mail_policy.update");
  if (!perm.ok) return perm.response;

  const body = await req.json();
  const next = normalize(body?.allowedDomains);

  const row = await prisma.globalPolicy.upsert({
    where: { id: "global" },
    update: { allowedDomains: next, updatedBy: perm.user.id },
    create: { id: "global", allowedDomains: next, updatedBy: perm.user.id },
  });

  await logActivity({
    actorType: "ADMIN",
    actorId: perm.user.id,
    actorLabel: perm.user.username,
    action: Activity.AdminPolicyGlobalUpdate,
    targetType: "GlobalPolicy",
    targetId: "global",
    metadata: { allowedDomains: next },
  });

  return NextResponse.json({ allowedDomains: row.allowedDomains, updatedAt: row.updatedAt });
}
