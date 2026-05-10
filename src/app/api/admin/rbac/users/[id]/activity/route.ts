import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/rbac/users/[id]/activity — paginated activity log for one admin user */
export async function GET(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.users.read");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const user = await prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30")));

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where: { adminId: id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminActivityLog.count({ where: { adminId: id } }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
