/**
 * Activity logger — every significant admin or staff action writes here.
 *
 * Never throws. Logging failures must not break the user-visible action.
 */

import prisma from "@/lib/prisma";
import type { ActorType } from "@prisma/client";

export interface LogArgs {
  actorType: ActorType;
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logActivity(args: LogArgs): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorType: args.actorType,
        actorId: args.actorId ?? null,
        actorLabel: args.actorLabel ?? null,
        action: args.action,
        targetType: args.targetType ?? null,
        targetId: args.targetId ?? null,
        metadata: (args.metadata as object | undefined) ?? undefined,
        ipAddress: args.ipAddress ?? null,
        userAgent: args.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[activity] failed to log", args.action, err);
  }
}

/** Canonical action strings — keep flat and grep-friendly. */
export const Activity = {
  // Staff auth
  StaffLoginSuccess: "staff.login.success",
  StaffLoginFailed: "staff.login.failed",
  StaffPasswordReset: "staff.password.reset",
  StaffTotpEnabled: "staff.2fa.totp.enabled",
  StaffTotpDisabled: "staff.2fa.totp.disabled",
  StaffEmailOtpEnabled: "staff.2fa.email_otp.enabled",
  StaffEmailOtpDisabled: "staff.2fa.email_otp.disabled",
  StaffLogout: "staff.logout",

  // Staff mail actions
  StaffEmailOpen: "staff.email.open",
  StaffEmailSend: "staff.email.send",
  StaffEmailSendBlocked: "staff.email.send.blocked",
  StaffEmailTrash: "staff.email.trash",
  StaffEmailDelete: "staff.email.delete",
  StaffDraftSave: "staff.draft.save",
  StaffLabelCreate: "staff.label.create",

  // Admin actions
  AdminStaffCreate: "admin.staff.create",
  AdminStaffUpdate: "admin.staff.update",
  AdminStaffSuspend: "admin.staff.suspend",
  AdminStaffPasswordReset: "admin.staff.password.reset",
  AdminPolicyGlobalUpdate: "admin.policy.global.update",
  AdminPolicyStaffUpdate: "admin.policy.staff.update",
  AdminImpersonateView: "admin.impersonate.view",        // opened mailbox
  AdminImpersonateEmailOpen: "admin.impersonate.email.open",
  AdminOutboxRelease: "admin.outbox.release",
  AdminOutboxDiscard: "admin.outbox.discard",

  // System
  SystemInboundMail: "system.inbound.mail",
} as const;
