import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requirePermission, countSuperManagers, logAdminActivity } from "@/lib/admin/permissions";

type Ctx = { params: Promise<{ id: string }> };

const userSelect = {
  id: true, username: true, displayName: true,
  isActive: true, createdAt: true, updatedAt: true, lastLoginAt: true,
  totpEnabled: true,
  roles: {
    select: {
      assignedAt: true,
      assignedBy: true,
      role: { select: { id: true, name: true, color: true, description: true, isSystem: true } },
    },
  },
};

/** GET /api/admin/rbac/users/[id] */
export async function GET(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.users.read");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const user = await prisma.adminUser.findUnique({ where: { id }, select: userSelect });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

/** PATCH /api/admin/rbac/users/[id] — update displayName, isActive, password */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.users.update");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { displayName, isActive, password } = await req.json();

  // Guard: cannot deactivate the last active SUPER_MANAGER
  if (isActive === false && target.isActive) {
    const isSuperManager = target.roles.some((r) => r.role.name === "SUPER_MANAGER");
    if (isSuperManager) {
      const count = await countSuperManagers();
      if (count <= 1) {
        return NextResponse.json({ error: "Cannot deactivate the last active SUPER_MANAGER." }, { status: 400 });
      }
    }
  }

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName?.trim() || null;
  if (isActive    !== undefined) data.isActive    = isActive;
  if (password) {
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(password, 12);
    // Invalidate TOTP so user must set up again after password reset? — optional, left as is.
  }

  const user = await prisma.adminUser.update({ where: { id }, data, select: userSelect });

  await logAdminActivity(perm.user.id, isActive === false ? "USER_DISABLED" : "USER_UPDATED",
    { targetUserId: id }, req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ user });
}

/** DELETE /api/admin/rbac/users/[id] */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const perm = await requirePermission(req, "rbac.users.delete");
  if (!perm.ok) return perm.response;
  const { id } = await params;

  if (id === perm.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSuperManager = target.roles.some((r) => r.role.name === "SUPER_MANAGER");
  if (isSuperManager) {
    const count = await countSuperManagers();
    if (count <= 1) {
      return NextResponse.json({ error: "Cannot delete the last active SUPER_MANAGER." }, { status: 400 });
    }
  }

  await prisma.adminUser.delete({ where: { id } });
  await logAdminActivity(perm.user.id, "USER_DELETED", { targetUserId: id, username: target.username },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ ok: true });
}
