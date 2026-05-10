/**
 * GET /api/admin/me
 * Returns the current admin user's profile + allowed sections.
 * Used by AdminShell to filter the sidebar and gate section access.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { SUPER_MANAGER_ROLE } from "@/lib/admin/permissions";

// Maps each sidebar section to the action ID that gates it.
const SECTION_GATES: Record<string, string> = {
  dashboard:     "dashboard.stats",
  contacts:      "contacts.list",
  careers:       "careers.list",
  chats:         "chats.list",
  ngo:           "ngo.list",
  notifications: "notifications.list",
  staff:         "staff.list",
  mailbox:       "mailbox.list",
  policy:        "mail_policy.read",
  activity:      "activity.list",
  invoice:       "invoice.list",
  database:      "database.tables",
  rbac:          "rbac.users.list",
};

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true, username: true, displayName: true, isActive: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
              permissions: {
                select: {
                  actionId: true,
                  action: { select: { isEnabled: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.isActive) return NextResponse.json({ error: "Account disabled" }, { status: 403 });

  const isSuperManager = user.roles.some((r) => r.role.name === SUPER_MANAGER_ROLE);

  // Collect allowed action IDs from all roles
  const allowedActionIds = new Set<string>();
  for (const ur of user.roles) {
    for (const perm of ur.role.permissions) {
      if (perm.action.isEnabled) allowedActionIds.add(perm.actionId);
    }
  }

  // Derive allowed sections from gate actions
  const allowedSections = isSuperManager
    ? Object.keys(SECTION_GATES)
    : Object.entries(SECTION_GATES)
        .filter(([, actionId]) => allowedActionIds.has(actionId))
        .map(([section]) => section);

  return NextResponse.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isSuperManager,
    allowedSections,
  });
}
