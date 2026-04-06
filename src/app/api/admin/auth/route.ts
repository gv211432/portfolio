import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import {
  signAdminToken,
  signSetupToken,
  setAdminCookie,
  clearAdminCookie,
  requireAdmin,
} from "@/lib/adminAuth";

type RecoveryCode = { hash: string; used: boolean };

/** POST /api/admin/auth — login (username + password + optional TOTP) */
export async function POST(request: NextRequest) {
  try {
    const { username, password, totp } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    // Timing-safe: always hash-compare even if user not found
    const dummyHash = "$2b$10$dummyhashfordummycomparison.dummy";
    const passwordValid = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!admin || !passwordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ── 2FA not set up yet ──────────────────────────────────────────────────
    if (!admin.totpEnabled) {
      const setupToken = await signSetupToken(admin.id);
      return NextResponse.json(
        { success: false, requiresTotpSetup: true, setupToken },
        { status: 200 }
      );
    }

    // ── 2FA required ────────────────────────────────────────────────────────
    if (!totp) {
      return NextResponse.json(
        { success: false, message: "Authenticator code required" },
        { status: 401 }
      );
    }

    const totpCode = String(totp).trim().replace(/\s/g, "");

    // Check regular TOTP
    const totpValid =
      admin.totpSecret &&
      speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: totpCode, window: 1 });

    // Check recovery codes if TOTP failed
    let usedRecoveryIndex = -1;
    if (!totpValid && admin.recoveryCodes) {
      const codes = admin.recoveryCodes as RecoveryCode[];
      for (let i = 0; i < codes.length; i++) {
        if (!codes[i].used && await bcrypt.compare(totpCode, codes[i].hash)) {
          usedRecoveryIndex = i;
          break;
        }
      }
    }

    if (!totpValid && usedRecoveryIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Mark recovery code as used
    if (usedRecoveryIndex !== -1) {
      const codes = admin.recoveryCodes as RecoveryCode[];
      codes[usedRecoveryIndex].used = true;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { recoveryCodes: codes },
      });
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
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: admin.username });
}
