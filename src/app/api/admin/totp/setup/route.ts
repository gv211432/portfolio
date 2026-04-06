/**
 * POST /api/admin/totp/setup
 *
 * Called after password verification to begin TOTP enrollment.
 * Body: { setupToken }
 * Returns: { secret, qrDataUrl, otpauthUri }
 *
 * Stores the pending secret in DB (totpEnabled stays false until verify-setup).
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { verifySetupToken } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { setupToken } = await request.json();
    if (!setupToken) {
      return NextResponse.json({ error: "Setup token required" }, { status: 400 });
    }

    const adminId = await verifySetupToken(setupToken);
    if (!adminId) {
      return NextResponse.json({ error: "Invalid or expired setup token" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Reuse existing pending secret if already in setup, otherwise generate new one
    const secret = (!admin.totpEnabled && admin.totpSecret)
      ? admin.totpSecret
      : speakeasy.generateSecret({ length: 20 }).base32;

    // Save pending secret (totpEnabled remains false)
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { totpSecret: secret },
    });

    const otpauthUri = speakeasy.otpauthURL({
      secret,
      label: encodeURIComponent(admin.username),
      issuer: "Gaurav.One Admin",
      encoding: "base32",
    });
    const qrDataUrl = await QRCode.toDataURL(otpauthUri, { width: 256, margin: 2 });

    return NextResponse.json({ secret, qrDataUrl, otpauthUri });
  } catch (err) {
    console.error("[TOTP setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
