import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, logAdminActivity } from "@/lib/admin/permissions";

const roleSelect = {
  id: true, name: true, description: true, color: true,
  isSystem: true, createdAt: true, updatedAt: true,
  _count: { select: { users: true, permissions: true } },
};

/** GET /api/admin/rbac/roles */
export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.roles.list");
  if (!perm.ok) return perm.response;

  const roles = await prisma.adminRole.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: roleSelect,
  });
  return NextResponse.json({ roles });
}

/** POST /api/admin/rbac/roles — create a custom role */
export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.roles.create");
  if (!perm.ok) return perm.response;

  const { name, description, color, actionIds = [] } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  const nameUp = name.trim().toUpperCase().replace(/\s+/g, "_");

  const existing = await prisma.adminRole.findUnique({ where: { name: nameUp } });
  if (existing) return NextResponse.json({ error: "Role name already exists" }, { status: 409 });

  const role = await prisma.adminRole.create({
    data: {
      name:        nameUp,
      description: description?.trim() || null,
      color:       color || "#6366f1",
      isSystem:    false,
    },
    select: roleSelect,
  });

  // Assign permissions
  if (actionIds.length > 0) {
    const validActions = await prisma.adminAction.findMany({
      where: { id: { in: actionIds } },
      select: { id: true },
    });
    await prisma.adminRolePermission.createMany({
      data: validActions.map((a) => ({ roleId: role.id, actionId: a.id })),
      skipDuplicates: true,
    });
  }

  await logAdminActivity(perm.user.id, "ROLE_CREATED", { roleId: role.id, roleName: role.name },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ role }, { status: 201 });
}
