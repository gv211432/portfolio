import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

/** GET /api/admin/rbac/startup — health check: does an active SUPER_MANAGER exist? */
export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.users.list");
  if (!perm.ok) return perm.response;

  const count = await prisma.adminUser.count({
    where: {
      isActive: true,
      roles: { some: { role: { name: "SUPER_MANAGER" } } },
    },
  });

  return NextResponse.json({ hasSuperAdmin: count > 0, count });
}
