import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  signAdminToken,
  setAdminCookie,
  clearAdminCookie,
  requireAdmin,
} from "@/lib/adminAuth";

/** POST /api/admin/auth — login */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signAdminToken({ id: admin.id, username: admin.username });
    const response = NextResponse.json({ success: true, username: admin.username });
    return setAdminCookie(response, token);
  } catch (err) {
    console.error("[Admin Auth POST]", err);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}

/** DELETE /api/admin/auth — logout */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearAdminCookie(response);
}

/** GET /api/admin/auth — check session */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, username: admin.username });
}
