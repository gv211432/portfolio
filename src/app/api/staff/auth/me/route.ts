/**
 * GET /api/staff/auth/me — returns current session + staff profile + 2FA status.
 * Used by the login flow UI to know which step to render.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readStaffSession } from "@/lib/mail/staffAuth";

export async function GET(req: NextRequest) {
  const s = await readStaffSession(req);
  if (!s) return NextResponse.json({ authenticated: false }, { status: 401 });

  const [addr, twoFactor] = await Promise.all([
    prisma.staffEmailAddress.findUnique({ where: { staffId: s.staff.id } }),
    prisma.staffTwoFactor.findMany({ where: { staffId: s.staff.id } }),
  ]);

  return NextResponse.json({
    authenticated: true,
    stage: s.session.stage,
    staff: {
      id: s.staff.id,
      firstName: s.staff.firstName,
      lastName: s.staff.lastName,
      displayName: s.staff.displayName,
      email: addr?.email ?? null,
      mustResetPassword: s.staff.mustResetPassword,
      profileImageUrl: s.staff.profileImageUrl,
    },
    twoFactor: twoFactor.map((f) => ({
      method: f.method,
      enabled: f.enabled,
      otpTargetEmail: f.method === "EMAIL_OTP" ? f.otpTargetEmail : undefined,
    })),
  });
}
