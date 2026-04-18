/**
 * POST /api/staff/auth/forgot-password/verify
 * Body: { email, code, newPassword }
 *
 * Verifies the OTP stored in ChatKVStore and updates the password.
 * No auth required (pre-login).
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/mail/staffAuth";

const KV_PREFIX = "pwd_reset:";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (typeof email !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "email, code and newPassword required" }, { status: 400 });
    }
    if (newPassword.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
    }
    if (newPassword.length > 256) {
      return NextResponse.json({ error: "Password too long" }, { status: 400 });
    }

    const staffAddr = await prisma.staffEmailAddress.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { staff: true },
    });

    if (!staffAddr || staffAddr.staff.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { staff } = staffAddr;
    const kvKey = KV_PREFIX + staff.id;

    const kv = await prisma.chatKVStore.findUnique({ where: { key: kvKey } });
    if (!kv) {
      return NextResponse.json({ error: "No reset request found. Please request a new code." }, { status: 400 });
    }

    let parsed: { hash: string; expiresAt: string; staffId: string };
    try {
      parsed = JSON.parse(kv.value);
    } catch {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    if (new Date(parsed.expiresAt) < new Date()) {
      await prisma.chatKVStore.delete({ where: { key: kvKey } }).catch(() => {});
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 401 });
    }

    const valid = await bcrypt.compare(code.trim(), parsed.hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    // Update password and clear mustResetPassword flag
    const passwordHash = await hashPassword(newPassword);
    await prisma.staff.update({
      where: { id: staff.id },
      data: { passwordHash, mustResetPassword: false },
    });

    // Clean up OTP
    await prisma.chatKVStore.delete({ where: { key: kvKey } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password/verify]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
