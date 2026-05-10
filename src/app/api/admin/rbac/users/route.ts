import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requirePermission, logAdminActivity } from "@/lib/admin/permissions";

const userSelect = {
  id: true, username: true, displayName: true,
  isActive: true, createdAt: true, lastLoginAt: true,
  totpEnabled: true,
  roles: {
    select: {
      assignedAt: true,
      assignedBy: true,
      role: { select: { id: true, name: true, color: true, description: true } },
    },
  },
};

/** GET /api/admin/rbac/users — list admin users with pagination + search */
export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.users.list");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search")?.trim();
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (active === "true")  where.isActive = true;
  if (active === "false") where.isActive = false;
  if (search) {
    where.OR = [
      { username:    { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.adminUser.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, select: userSelect }),
    prisma.adminUser.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

/** POST /api/admin/rbac/users — create a new admin user */
export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.users.create");
  if (!perm.ok) return perm.response;

  const { username, displayName, password, roleIds = [] } = await req.json();

  if (!username?.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const existing = await prisma.adminUser.findUnique({ where: { username: username.trim() } });
  if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.create({
    data: {
      username:    username.trim(),
      displayName: displayName?.trim() || null,
      passwordHash: hash,
      isActive:    true,
      roles: {
        create: roleIds.map((roleId: string) => ({
          roleId,
          assignedBy: perm.user.id,
        })),
      },
    },
    select: userSelect,
  });

  await logAdminActivity(perm.user.id, "USER_CREATED", { targetUserId: user.id, username: user.username },
    req.headers.get("x-forwarded-for") ?? undefined);

  return NextResponse.json({ user }, { status: 201 });
}
