import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import {
  signAdminToken,
  signSetupToken,
  signEmailSetupToken,
  setAdminCookie,
  clearAdminCookie,
  requireAdmin,
  revokeAdminToken,
  ADMIN_COOKIE,
} from "@/lib/adminAuth";

type RecoveryCode = { hash: string; used: boolean };

const MAX_ATTEMPTS  = 3;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

/** POST /api/admin/auth — login (username + password + TOTP always expected) */
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

    // Check lockout before doing any crypto
    if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingMs = admin.lockedUntil.getTime() - Date.now();
      const mins = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        { success: false, message: `Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.` },
        { status: 429 }
      );
    }

    // Timing-safe: always hash-compare even if user not found
    const dummyHash = "$2b$10$dummyhashfordummycomparison.dummy";
    const passwordValid = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!admin || !passwordValid) {
      // Increment attempt counter; lock after MAX_ATTEMPTS
      if (admin) {
        const attempts = (admin.loginAttempts ?? 0) + 1;
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            loginAttempts: attempts,
            lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
          },
        });
      }
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, message: "Account is disabled. Contact your super admin." },
        { status: 403 }
      );
    }

    // ── TOTP not set up yet → first-login setup flow ───────────────────────
    if (!admin.totpEnabled) {
      const setupToken = await signSetupToken(admin.id);
      return NextResponse.json(
        { success: false, requiresTotpSetup: true, setupToken },
        { status: 200 }
      );
    }

    // ── TOTP required ──────────────────────────────────────────────────────
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

    // ── Recovery email not yet verified → must set it up before dashboard ──
    if (!admin.recoveryEmailVerified) {
      const emailSetupToken = await signEmailSetupToken(admin.id);
      return NextResponse.json(
        { success: false, requiresEmailSetup: true, emailSetupToken },
        { status: 200 }
      );
    }

    // Successful login — reset lockout counter
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date(), loginAttempts: 0, lockedUntil: null },
    });

    const token = await signAdminToken({ id: admin.id, username: admin.username });
    const response = NextResponse.json({ success: true, username: admin.username });
    return setAdminCookie(response, token);
  } catch (err) {
    console.error("[Admin Auth POST]", err);
    return NextResponse.json({ success: false, message: "Internal error" }, { status: 500 });
  }
}

/** DELETE /api/admin/auth — logout (revokes jti so token can't be replayed) */
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (token) await revokeAdminToken(token);
  const response = NextResponse.json({ success: true });
  return clearAdminCookie(response);
}

/** GET /api/admin/auth — check session */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, username: admin.username });
}
