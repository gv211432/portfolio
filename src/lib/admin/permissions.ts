/**
 * Permission enforcement for admin API routes.
 *
 * Usage in a route handler:
 *   const perm = await requirePermission(req, "invoice.list");
 *   if (!perm.ok) return perm.response;
 *   // perm.user  — AdminPayload
 *   // perm.isSuperManager — true if user has SUPER_MANAGER (bypass all checks)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ADMIN_COOKIE, verifyAdminToken, AdminPayload } from "@/lib/adminAuth";
import type { ActionId } from "./actionRegistry";

export const SUPER_MANAGER_ROLE = "SUPER_MANAGER";

export type PermResult =
  | { ok: true;  user: AdminPayload; isSuperManager: boolean }
  | { ok: false; response: NextResponse };

/**
 * Verify that the requesting admin has permission for the given action.
 * SUPER_MANAGER role bypasses all action-level checks.
 */
export async function requirePermission(
  req: NextRequest,
  actionId: ActionId,
): Promise<PermResult> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Single query: is this active user allowed?
  const user = await prisma.adminUser.findFirst({
    where: {
      id: payload.id,
      isActive: true,
      roles: {
        some: {
          role: {
            OR: [
              // SUPER_MANAGER bypasses everything
              { name: SUPER_MANAGER_ROLE },
              // Other roles: must have explicit permission + action must be enabled
              {
                permissions: {
                  some: {
                    actionId,
                    action: { isEnabled: true },
                  },
                },
              },
            ],
          },
        },
      },
    },
    select: { id: true, username: true },
  });

  if (!user) {
    // Distinguish inactive vs. no-permission — both return 403 to avoid enumeration
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // Separately determine if this user is a SUPER_MANAGER (callers may need this)
  const isSuperManager = await prisma.adminUser.findFirst({
    where: {
      id: payload.id,
      isActive: true,
      roles: { some: { role: { name: SUPER_MANAGER_ROLE } } },
    },
    select: { id: true },
  }).then(Boolean);

  return { ok: true, user: payload, isSuperManager };
}

/** Count how many active users hold the SUPER_MANAGER role. */
export async function countSuperManagers(): Promise<number> {
  return prisma.adminUser.count({
    where: {
      isActive: true,
      roles: { some: { role: { name: SUPER_MANAGER_ROLE } } },
    },
  });
}

/** Log an RBAC activity event. */
export async function logAdminActivity(
  adminId: string,
  event: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
) {
  await prisma.adminActivityLog.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { adminId, event, metadata: (metadata ?? null) as any, ipAddress: ipAddress ?? null },
  });
}
