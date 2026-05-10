/** GET /api/admin/profile — own profile (no secrets) */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true, username: true, displayName: true,
      isActive: true, totpEnabled: true,
      recoveryEmail: true, recoveryEmailVerified: true,
      lastLoginAt: true, createdAt: true,
      roles: { select: { role: { select: { id: true, name: true, color: true } } } },
    },
  });

  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ admin });
}
