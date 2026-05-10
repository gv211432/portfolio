/**
 * POST /api/staff/auth/2fa/totp/verify-setup
 * Body: { code }
 *
 * Confirms a TOTP code against the pending secret, flips `enabled = true`,
 * generates 8 one-time recovery codes (returned plaintext once, stored hashed),
 * and advances the session stage if we were in PENDING_2FA_SETUP.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import speakeasy from "speakeasy";
import {
  readStaffSession,
  updateSessionStage,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { sendWelcomeEmailIfFirst } from "@/lib/mail/staffWelcome";
import { issueTrustCookie } from "@/lib/mail/staffDevice";
import { logActivity, Activity } from "@/lib/mail/activity";

function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const hex = randomBytes(6).toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 10)}`;
  });
}

export async function POST(req: NextRequest) {
  try {
    const s = await readStaffSession(req);
    if (!s) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { code } = await req.json();
    if (typeof code !== "string") {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const record = await prisma.staffTwoFactor.findUnique({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
    });
    if (!record?.totpSecret) {
      return NextResponse.json({ error: "TOTP setup not initiated" }, { status: 409 });
    }

    const valid = speakeasy.totp.verify({
      secret:   record.totpSecret,
      encoding: "base32",
      token:    code.trim(),
      window:   1,
    });
    if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 401 });

    // Generate 8 one-time recovery codes
    const plainCodes  = generateRecoveryCodes(8);
    const hashedCodes = await Promise.all(
      plainCodes.map(async (c) => ({ hash: await bcrypt.hash(c, 10), used: false }))
    );

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
      data: { enabled: true, recoveryCodes: hashedCodes },
    });

    let nextStep: string | null = null;
    if (s.session.stage === "PENDING_2FA_SETUP") {
      const next = await computeNextStage(s.staff.id, new Set());
      await updateSessionStage(s.session.id, next);
      nextStep = next;
      if (next === "ACTIVE") {
        void sendWelcomeEmailIfFirst(s.staff.id);
      }
    }

    await logActivity({
      actorType: "STAFF",
      actorId:   s.staff.id,
      action:    Activity.StaffTotpEnabled,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    const response = NextResponse.json({ ok: true, recoveryCodes: plainCodes, nextStep });
    // Trust this device when the initial setup flow completes to ACTIVE
    if (nextStep === "ACTIVE") await issueTrustCookie(s.staff.id, req, response);
    return response;
  } catch (err) {
    console.error("[staff/totp/verify-setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
