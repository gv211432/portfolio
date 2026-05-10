import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, countSuperManagers, logAdminActivity } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/rbac/users/[id]/roles
 * Body: { roleIds: string[] } — replaces the full role set for the user.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.users.roles.update");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const user = await prisma.adminUser.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { roleIds }: { roleIds: string[] } = await req.json();
  if (!Array.isArray(roleIds)) return NextResponse.json({ error: "roleIds must be an array" }, { status: 400 });

  // Guard: cannot remove SUPER_MANAGER if this is the last one
  const hadSuperManager = user.roles.some((r) => r.role.name === "SUPER_MANAGER");
  const willHaveSuperManager = await prisma.adminRole.findFirst({
    where: { id: { in: roleIds }, name: "SUPER_MANAGER" },
  }).then(Boolean);

  if (hadSuperManager && !willHaveSuperManager) {
    const count = await countSuperManagers();
    if (count <= 1) {
      return NextResponse.json(
        { error: "Cannot remove SUPER_MANAGER from the last user who holds it." },
        { status: 400 }
      );
    }
  }

  // Validate all roleIds exist
  const roles = await prisma.adminRole.findMany({ where: { id: { in: roleIds } }, select: { id: true } });
  if (roles.length !== roleIds.length) {
    return NextResponse.json({ error: "One or more role IDs are invalid." }, { status: 400 });
  }

  // Replace: delete all current, insert new
  await prisma.$transaction([
    prisma.adminUserRole.deleteMany({ where: { userId: id } }),
    prisma.adminUserRole.createMany({
      data: roleIds.map((roleId) => ({ userId: id, roleId, assignedBy: perm.user.id })),
      skipDuplicates: true,
    }),
  ]);

  await logAdminActivity(perm.user.id, "ROLE_CHANGED",
    { targetUserId: id, newRoleIds: roleIds },
    req.headers.get("x-forwarded-for") ?? undefined);

  const updated = await prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true, username: true, displayName: true,
      roles: { select: { role: { select: { id: true, name: true, color: true } }, assignedAt: true } },
    },
  });

  return NextResponse.json({ user: updated });
}
