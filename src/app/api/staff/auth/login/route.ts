/**
 * POST /api/staff/auth/login
 * Body: { email, password }
 *
 * Verifies credentials, creates a DB session with the appropriate stage,
 * and returns the next required step so the client can route the user.
 *
 * Trusted-device logic:
 *   If a valid `staff_device_token` cookie is present for this staff member,
 *   EMAIL_OTP is skipped (TOTP is always still required when enrolled).
 *   The skip only activates when TOTP is also enrolled — EMAIL_OTP-only users
 *   always go through their factor regardless.
 *
 * Possible nextStep values:
 *   "PASSWORD_RESET" | "2FA_SETUP" | "TOTP" | "EMAIL_OTP" | "DONE"
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyPassword,
  createStaffSession,
  setStaffCookie,
  computeNextStage,
  clientIp,
} from "@/lib/mail/staffAuth";
import { verifyDeviceToken } from "@/lib/mail/staffDevice";
import { logActivity, Activity } from "@/lib/mail/activity";

function stageToStep(stage: string): string {
  switch (stage) {
    case "PENDING_PASSWORD_RESET": return "PASSWORD_RESET";
    case "PENDING_2FA_SETUP":      return "2FA_SETUP";
    case "PENDING_TOTP":           return "TOTP";
    case "PENDING_EMAIL_OTP":      return "EMAIL_OTP";
    case "ACTIVE":                 return "DONE";
    default:                       return stage;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const ip         = clientIp(req);
    const ua         = req.headers.get("user-agent");
    const normalized = email.toLowerCase().trim();

    const addr = await prisma.staffEmailAddress.findUnique({
      where: { email: normalized },
      include: { staff: true },
    });

    if (!addr || addr.staff.status !== "ACTIVE") {
      await logActivity({
        actorType:  "SYSTEM",
        actorLabel: normalized,
        action:     Activity.StaffLoginFailed,
        metadata:   { reason: "unknown_email_or_inactive" },
        ipAddress:  ip,
        userAgent:  ua,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, addr.staff.passwordHash);
    if (!ok) {
      await logActivity({
        actorType:  "STAFF",
        actorId:    addr.staff.id,
        actorLabel: normalized,
        action:     Activity.StaffLoginFailed,
        metadata:   { reason: "bad_password" },
        ipAddress:  ip,
        userAgent:  ua,
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Recognised trusted device? → skip EMAIL_OTP (TOTP still required)
    const { trusted: isTrustedDevice } = await verifyDeviceToken(addr.staff.id, req);

    const stage = await computeNextStage(
      addr.staff.id,
      new Set(),
      { skipEmailOtp: isTrustedDevice },
    );

    const token = await createStaffSession({
      staffId:   addr.staff.id,
      stage,
      ipAddress: ip,
      userAgent: ua,
    });

    await prisma.staff.update({
      where: { id: addr.staff.id },
      data:  { lastLoginAt: new Date(), lastLoginIp: ip ?? undefined },
    });

    await logActivity({
      actorType:  "STAFF",
      actorId:    addr.staff.id,
      actorLabel: normalized,
      action:     Activity.StaffLoginSuccess,
      metadata:   { stage, trustedDevice: isTrustedDevice },
      ipAddress:  ip,
      userAgent:  ua,
    });

    const res = NextResponse.json({ nextStep: stageToStep(stage), trustedDevice: isTrustedDevice });
    return setStaffCookie(res, token);
  } catch (err) {
    console.error("[staff/login]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
