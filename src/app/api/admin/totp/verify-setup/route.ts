/**
 * POST /api/admin/totp/verify-setup
 *
 * Verifies the TOTP code against the pending secret, enables 2FA,
 * and returns 8 one-time recovery codes (plain text, shown once only).
 *
 * Body: { setupToken, totpCode }
 * Returns: { success, recoveryCodes: string[] }
 *
 * Does NOT issue a session — admin must log in again with full credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { verifySetupToken, signEmailSetupToken } from "@/lib/adminAuth";
import { randomBytes } from "crypto";

function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(6);
    const hex   = bytes.toString("hex").toUpperCase();
    // Format: XXXX-XXXX-XX (10 chars + 2 dashes)
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 10)}`;
  });
}

export async function POST(request: NextRequest) {
  try {
    const { setupToken, totpCode } = await request.json();

    if (!setupToken || !totpCode) {
      return NextResponse.json(
        { error: "Setup token and TOTP code are required" },
        { status: 400 }
      );
    }

    const adminId = await verifySetupToken(setupToken);
    if (!adminId) {
      return NextResponse.json({ error: "Invalid or expired setup token" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !admin.totpSecret) {
      return NextResponse.json(
        { error: "No pending TOTP setup found. Start setup again." },
        { status: 400 }
      );
    }

    const code  = String(totpCode).trim().replace(/\s/g, "");
    const valid = speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: code, window: 1 });
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid authenticator code. Please try again." },
        { status: 400 }
      );
    }

    // Generate recovery codes
    const plainCodes = generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(
      plainCodes.map(async (c) => ({ hash: await bcrypt.hash(c, 10), used: false }))
    );

    // Enable TOTP
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        totpEnabled:   true,
        recoveryCodes: hashedCodes,
      },
    });

    // Issue emailSetupToken — admin must now verify a recovery email before dashboard access
    const emailSetupToken = await signEmailSetupToken(adminId);
    return NextResponse.json({ success: true, recoveryCodes: plainCodes, emailSetupToken });
  } catch (err) {
    console.error("[TOTP verify-setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
