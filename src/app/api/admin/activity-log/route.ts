/**
 * GET /api/admin/activity-log
 *
 * Query: ?actorType=ADMIN|STAFF|SYSTEM &action=... &targetType=... &targetId=...
 *        &staffId=... (convenience — maps to actorId when STAFF, or targetId when STAFF target)
 *        &from=ISO &to=ISO &page=1 &limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "activity.list");
  if (!perm.ok) return perm.response;

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") ?? "50")));

  const where: Record<string, unknown> = {};
  const actorType = sp.get("actorType");
  if (actorType) where.actorType = actorType;
  const action = sp.get("action");
  if (action) where.action = action;
  const targetType = sp.get("targetType");
  if (targetType) where.targetType = targetType;
  const targetId = sp.get("targetId");
  if (targetId) where.targetId = targetId;
  const actorId = sp.get("actorId");
  if (actorId) where.actorId = actorId;

  const staffId = sp.get("staffId");
  if (staffId) {
    where.OR = [
      { actorType: "STAFF", actorId: staffId },
      { targetType: "Staff", targetId: staffId },
    ];
  }

  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    where.createdAt = range;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
}
