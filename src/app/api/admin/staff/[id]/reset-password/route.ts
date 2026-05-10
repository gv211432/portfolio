/**
 * POST /api/admin/staff/[id]/reset-password
 * Body: { sendEmail?: boolean }
 *
 * Generates a new temporary password, sets mustResetPassword=true,
 * revokes all active sessions, returns the plaintext password ONCE.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { hashPassword } from "@/lib/mail/staffAuth";
import { generateFriendlyPassword } from "@/lib/mail/text";
import { sendStaffCredentials } from "@/lib/mail/systemMail";
import { logActivity, Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const perm = await requirePermission(req, "staff.reset_password");
  if (!perm.ok) return perm.response;
  const { id } = await ctx.params;

  const { sendEmail = true } = (await req.json().catch(() => ({}))) as { sendEmail?: boolean };

  const staff = await prisma.staff.findUnique({ where: { id }, include: { emailAddress: true } });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tempPassword = generateFriendlyPassword();
  const hash = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.staff.update({
      where: { id },
      data: { passwordHash: hash, mustResetPassword: true },
    }),
    prisma.staffSession.updateMany({
      where: { staffId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await logActivity({
    actorType: "ADMIN",
    actorId: perm.user.id,
    actorLabel: perm.user.username,
    action: Activity.AdminStaffPasswordReset,
    targetType: "Staff",
    targetId: id,
    metadata: { sendEmail },
  });

  if (sendEmail && staff.emailAddress) {
    void sendStaffCredentials({
      recoveryEmail: staff.recoveryEmail,
      staffName: `${staff.firstName} ${staff.lastName}`,
      staffEmail: staff.emailAddress.email,
      tempPassword,
      staffId: staff.id,
    });
  }

  return NextResponse.json({ tempPassword, credentialsEmailQueued: sendEmail });
}
