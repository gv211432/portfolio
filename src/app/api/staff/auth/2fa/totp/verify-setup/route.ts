/**
 * POST /api/staff/auth/2fa/totp/verify-setup
 * Body: { code }
 *
 * Confirms a TOTP code against the pending secret and flips `enabled = true`.
 * Advances session stage if we were in PENDING_2FA_SETUP.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import speakeasy from "speakeasy";
import {
  readStaffSession,
  updateSessionStage,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { logActivity, Activity } from "@/lib/mail/activity";

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
      secret: record.totpSecret,
      encoding: "base32",
      token: code.trim(),
      window: 1,
    });

    if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 401 });

    await prisma.staffTwoFactor.update({
      where: { staffId_method: { staffId: s.staff.id, method: "TOTP" } },
      data: { enabled: true },
    });

    let nextStep: string | null = null;
    if (s.session.stage === "PENDING_2FA_SETUP") {
      const next = await computeNextStage(s.staff.id, new Set());
      await updateSessionStage(s.session.id, next);
      nextStep = next;
    }

    await logActivity({
      actorType: "STAFF",
      actorId: s.staff.id,
      action: Activity.StaffTotpEnabled,
      ipAddress: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true, nextStep });
  } catch (err) {
    console.error("[staff/totp/verify-setup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
