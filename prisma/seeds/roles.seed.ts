import { PrismaClient } from "@prisma/client";
import { ADMIN_ACTIONS, ActionDef } from "../../src/lib/admin/actionRegistry";

// Helper to get action IDs matching a predicate
function ids(filter: (a: ActionDef) => boolean): string[] {
  return ADMIN_ACTIONS.filter(filter).map((a) => a.id);
}

// All read-only actions (isReadOnly + not system)
const allReadOnly = ids((a) => a.isReadOnly && !a.isSystem);

// All non-system actions
const allNonSystem = ids((a) => !a.isSystem);

// Section helpers
const section = (s: string) => (a: ActionDef) => a.section === s && !a.isSystem;
const sectionRead = (s: string) => (a: ActionDef) => a.section === s && a.isReadOnly && !a.isSystem;

interface RoleDef {
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  actionIds: string[];
}

const ROLE_DEFS: RoleDef[] = [
  {
    name: "SUPER_MANAGER",
    description: "Full unrestricted access to all actions. Bypasses action-level permission checks.",
    color: "#dc2626",
    isSystem: true,
    actionIds: allNonSystem,
  },
  {
    name: "SUPER_READER",
    description: "Read-only access to all sections.",
    color: "#7c3aed",
    isSystem: true,
    actionIds: allReadOnly,
  },
  {
    name: "RBAC_MANAGER",
    description: "Full access to RBAC management (users, roles, actions).",
    color: "#be123c",
    isSystem: true,
    actionIds: ids(section("rbac")),
  },
  {
    name: "DASHBOARD_READER",
    description: "View dashboard statistics.",
    color: "#0369a1",
    isSystem: false,
    actionIds: ids(sectionRead("dashboard")),
  },
  {
    name: "ACTIVITY_READER",
    description: "Read activity and audit logs.",
    color: "#334155",
    isSystem: false,
    actionIds: ids(section("activity")),
  },
  {
    name: "CONTACT_MANAGER",
    description: "Full access to contact submissions.",
    color: "#0891b2",
    isSystem: false,
    actionIds: ids(section("contacts")),
  },
  {
    name: "CONTACT_READER",
    description: "Read contact submissions only.",
    color: "#0e7490",
    isSystem: false,
    actionIds: ids(sectionRead("contacts")),
  },
  {
    name: "CAREERS_MANAGER",
    description: "Full access to job applications.",
    color: "#059669",
    isSystem: false,
    actionIds: ids(section("careers")),
  },
  {
    name: "CAREERS_READER",
    description: "Read job applications only.",
    color: "#047857",
    isSystem: false,
    actionIds: ids(sectionRead("careers")),
  },
  {
    name: "CHATS_MANAGER",
    description: "Manage chat leads (view and delete).",
    color: "#7c3aed",
    isSystem: false,
    actionIds: ids(section("chats")),
  },
  {
    name: "CHATS_READER",
    description: "Read chat leads only.",
    color: "#6d28d9",
    isSystem: false,
    actionIds: ids(sectionRead("chats")),
  },
  {
    name: "NGO_MANAGER",
    description: "Full access to NGO applications.",
    color: "#b45309",
    isSystem: false,
    actionIds: ids(section("ngo")),
  },
  {
    name: "NOTIFICATION_READER",
    description: "View notification logs.",
    color: "#92400e",
    isSystem: false,
    actionIds: ids(section("notifications")),
  },
  {
    name: "STAFF_MANAGER",
    description: "Create, update and delete staff accounts and reset passwords.",
    color: "#1d4ed8",
    isSystem: false,
    actionIds: [
      ...ids(section("staff")),
      "upload.staff_image",
    ],
  },
  {
    name: "STAFF_READER",
    description: "Read staff profiles and policies.",
    color: "#1e40af",
    isSystem: false,
    actionIds: ["staff.list", "staff.read", "staff.policy.read"],
  },
  {
    name: "EMAIL_POLICY_MANAGER",
    description: "Manage global mail policy settings.",
    color: "#4338ca",
    isSystem: false,
    actionIds: ids(section("mail_policy")),
  },
  {
    name: "EMAIL_IMPERSONATOR",
    description: "View and send emails from staff accounts (mailbox impersonation).",
    color: "#6d28d9",
    isSystem: false,
    actionIds: [
      ...ids(section("mailbox")),
      "staff.list",
      "staff.read",
    ],
  },
  {
    name: "DB_MANAGER",
    description: "Full access to the database viewer (read-only DB section).",
    color: "#065f46",
    isSystem: false,
    actionIds: ids(section("database")),
  },
  {
    name: "DB_READER",
    description: "Read database tables.",
    color: "#064e3b",
    isSystem: false,
    actionIds: ids(sectionRead("database")),
  },
  {
    name: "INVOICE_MANAGER",
    description: "Full access to invoices, clients, payment profiles and company settings.",
    color: "#92400e",
    isSystem: false,
    actionIds: ids((a) =>
      ["invoice", "invoice_clients", "invoice_payment", "invoice_company"].some((s) =>
        a.id.startsWith(s)
      ) && !a.isSystem
    ),
  },
  {
    name: "INVOICE_READER",
    description: "Read and download invoices only.",
    color: "#78350f",
    isSystem: false,
    actionIds: [
      "invoice.list",
      "invoice.read",
      "invoice.pdf.download",
      "invoice.versions.list",
      "invoice.email.logs",
      "invoice.sign.status",
      "invoice.next_number",
      "invoice_clients.list",
      "invoice_payment.list",
      "invoice_company.read",
    ],
  },
];

export async function seedRoles(prisma: PrismaClient) {
  console.log("  → Syncing roles...");
  let created = 0;
  let updated = 0;

  for (const def of ROLE_DEFS) {
    const existing = await prisma.adminRole.findUnique({ where: { name: def.name } });

    let roleId: string;
    if (!existing) {
      const role = await prisma.adminRole.create({
        data: {
          name:        def.name,
          description: def.description,
          color:       def.color,
          isSystem:    def.isSystem,
        },
      });
      roleId = role.id;
      created++;
    } else {
      await prisma.adminRole.update({
        where: { id: existing.id },
        data: {
          description: def.description,
          color:       def.color,
          isSystem:    def.isSystem,
        },
      });
      roleId = existing.id;
      updated++;
    }

    // Sync permissions: remove stale, add missing (upsert-style)
    const currentPerms = await prisma.adminRolePermission.findMany({
      where: { roleId },
      select: { actionId: true },
    });
    const currentIds = new Set(currentPerms.map((p) => p.actionId));
    const desiredIds = new Set(def.actionIds);

    // Remove permissions no longer in the definition
    const toRemove = Array.from(currentIds).filter((id) => !desiredIds.has(id));
    if (toRemove.length > 0) {
      await prisma.adminRolePermission.deleteMany({
        where: { roleId, actionId: { in: toRemove } },
      });
    }

    // Add new permissions — only for actions that exist in DB
    const toAdd = Array.from(desiredIds).filter((id) => !currentIds.has(id));
    if (toAdd.length > 0) {
      const existingActions = await prisma.adminAction.findMany({
        where: { id: { in: toAdd } },
        select: { id: true },
      });
      const validIds = existingActions.map((a) => a.id);
      if (validIds.length > 0) {
        await prisma.adminRolePermission.createMany({
          data: validIds.map((actionId) => ({ roleId, actionId })),
          skipDuplicates: true,
        });
      }
    }
  }

  console.log(`     Roles: ${created} created, ${updated} updated`);
}
