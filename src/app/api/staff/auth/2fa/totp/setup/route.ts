/**
 * POST /api/staff/auth/2fa/totp/setup
 *
 * Called during PENDING_2FA_SETUP or from settings when ACTIVE.
 * Generates (or reuses pending) TOTP secret and returns QR + otpauth URI.
 * Does NOT enable TOTP — verify-setup does that after code confirmation.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { readStaffSession } from "@/lib/mail/staffAuth";
import { MAIL_ENV } from "@/lib/mail/env";

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // allowed during setup OR when already active (to re-enroll)
    const ok = s.session.stage === "PENDING_2FA_SETUP" || s.session.stage === "ACTIVE";
    if (!ok) return NextResponse.json({ error: "Not allowed in current stage" }, { status: 409 });

    const existing = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
    });

    const secret = existing && !existing.enabled && existing.totpSecret
      ? existing.totpSecret
      : speakeasy.generateSecret({ length: 20 }).base32;

    await prisma.staffTwoFactor.upsert({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
      update: { totpSecret: secret, enabled: existing?.enabled ?? false },
      create: { staffId: s.staff.id, method: "TOTP", totpSecret: secret, enabled: false },
    });

    const addr = await prisma.staffEmailAddress.findUnique({ where: { staffId: s.staff.id } });
    const label = addr?.email ?? `${s.staff.firstName}@${MAIL_ENV.DOMAIN}`;

    const otpauthUri = speakeasy.otpauthURL({
      secret,
      label: encodeURIComponent(label),
      issuer: MAIL_ENV.DOMAIN,
      encoding: "base32",
    });
    const qrDataUrl = await QRCode.toDataURL(otpauthUri, { width: 256, margin: 2 });

    return NextResponse.json({ secret, qrDataUrl, otpauthUri });
  } catch (err) {
    console.error("[staff/totp/setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
