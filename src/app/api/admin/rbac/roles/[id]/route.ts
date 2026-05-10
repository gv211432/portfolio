import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, logAdminActivity } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

const roleFullSelect = {
  id: true, name: true, description: true, color: true,
  isSystem: true, createdAt: true, updatedAt: true,
  permissions: { select: { actionId: true, action: { select: { id: true, label: true, section: true, method: true, isReadOnly: true } } } },
  _count: { select: { users: true } },
};

/** GET /api/admin/rbac/roles/[id] — full role with permissions */
export async function GET(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.roles.read");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const role = await prisma.adminRole.findUnique({ where: { id }, select: roleFullSelect });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ role });
}

/** PATCH /api/admin/rbac/roles/[id] — update name/description/color */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.roles.update");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const existing = await prisma.adminRole.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.isSystem) return NextResponse.json({ error: "System roles cannot be renamed." }, { status: 400 });

  const { description, color } = await req.json();
  const data: Record<string, unknown> = {};
  if (description !== undefined) data.description = description?.trim() || null;
  if (color       !== undefined) data.color       = color;

  const role = await prisma.adminRole.update({ where: { id }, data, select: roleFullSelect });
  await logAdminActivity(perm.user.id, "ROLE_UPDATED", { roleId: id },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ role });
}

/** DELETE /api/admin/rbac/roles/[id] */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.roles.delete");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const existing = await prisma.adminRole.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.isSystem) return NextResponse.json({ error: "System roles cannot be deleted." }, { status: 400 });

  await prisma.adminRole.delete({ where: { id } });
  await logAdminActivity(perm.user.id, "ROLE_DELETED", { roleId: id, roleName: existing.name },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ ok: true });
}
