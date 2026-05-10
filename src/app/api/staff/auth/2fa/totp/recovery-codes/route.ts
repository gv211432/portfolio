/**
 * POST /api/staff/auth/2fa/totp/recovery-codes
 * Body: { totpCode }
 *
 * Regenerates 8 one-time TOTP recovery codes.
 * Requires an ACTIVE session and a valid current TOTP code to confirm identity.
 * Returns plaintext codes once — they are not retrievable again.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import prisma from "@/lib/prisma";
import { requireActiveStaff, clientIp } from "@/lib/mail/staffAuth";
import { logActivity } from "@/lib/mail/activity";

function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const hex = randomBytes(6).toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 10)}`;
  });
}

export async function POST(req: NextRequest) {
  try {
    const s = await requireActiveStaff(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { totpCode } = await req.json();
    if (typeof totpCode !== "string") {
      return NextResponse.json({ error: "totpCode required" }, { status: 400 });
    }

    const record = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
    });
    if (!record?.enabled || !record.totpSecret) {
      return NextResponse.json({ error: "TOTP is not enabled" }, { status: 409 });
    }

    const valid = speakeasy.totp.verify({
      secret:   record.totpSecret,
      encoding: "base32",
      token:    totpCode.trim(),
      window:   1,
    });
    if (!valid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

    const plainCodes  = generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(
      plainCodes.map(async (c) => ({ hash: await bcrypt.hash(c, 10), used: false }))
    );

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
      data:  { recoveryCodes: hashedCodes },
    });

    await logActivity({
      actorType: "STAFF",
      actorId:   s.staff.id,
      action:    "staff.totp.recovery_codes_regenerated",
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ recoveryCodes: plainCodes });
  } catch (err) {
    console.error("[staff/totp/recovery-codes]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
