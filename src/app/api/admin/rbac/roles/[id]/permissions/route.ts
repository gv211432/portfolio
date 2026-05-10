import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, logAdminActivity } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/rbac/roles/[id]/permissions
 * Body: { actionIds: string[] } — replaces the full permission set for the role.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.roles.permissions");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { actionIds }: { actionIds: string[] } = await req.json();
  if (!Array.isArray(actionIds)) return NextResponse.json({ error: "actionIds must be an array" }, { status: 400 });

  // Validate all action IDs exist in DB
  const validActions = await prisma.adminAction.findMany({
    where: { id: { in: actionIds } },
    select: { id: true },
  });
  const validSet = new Set(validActions.map((a) => a.id));
  const invalid  = actionIds.filter((id) => !validSet.has(id));
  if (invalid.length > 0) {
    return NextResponse.json({ error: `Unknown action IDs: ${invalid.join(", ")}` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.adminRolePermission.deleteMany({ where: { roleId: id } }),
    prisma.adminRolePermission.createMany({
      data: actionIds.map((actionId) => ({ roleId: id, actionId })),
      skipDuplicates: true,
    }),
  ]);

  await logAdminActivity(perm.user.id, "PERMISSION_CHANGED",
    { roleId: id, roleName: role.name, actionCount: actionIds.length },
    req.headers.get("x-forwarded-for") ?? undefined);

  const updated = await prisma.adminRole.findUnique({
    where: { id },
    select: {
      id: true, name: true,
      permissions: { select: { actionId: true } },
      _count: { select: { permissions: true } },
    },
  });

  return NextResponse.json({ role: updated });
}
