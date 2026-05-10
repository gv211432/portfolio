/**
 * GET /api/admin/outbox — list blocked/pending outbox items (admin review).
 * Query: status=BLOCKED|RELEASED|DISCARDED, staffId?, page, limit
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "mailbox.list");
  if (!perm.ok) return perm.response;

  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") ?? "BLOCKED";
  const staffId = sp.get("staffId") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50")));

  const where: Record<string, unknown> = { status };
  if (staffId) where.staffId = staffId;

  const [items, total] = await Promise.all([
    prisma.outboxEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { staff: { select: { id: true, firstName: true, lastName: true, displayName: true } } },
    }),
    prisma.outboxEmail.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
