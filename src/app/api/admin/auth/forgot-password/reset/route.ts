/**
 * POST /api/admin/auth/forgot-password/reset
 * Public — authenticated only by resetToken (15-min JWT).
 * Body: { resetToken, newPassword }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyPasswordResetToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { resetToken, newPassword } = await req.json();

  const adminId = await verifyPasswordResetToken(resetToken);
  if (!adminId) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 401 });
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ success: true });
}
