/**
 * Central action registry — single source of truth for all admin API actions.
 *
 * HOW TO EXTEND:
 *   1. Add a new entry to ADMIN_ACTIONS below.
 *   2. Run:  bun run seed:sync-actions
 *   3. In your new route, use requirePermission(req, "your.action.id").
 *   Done — the RBAC UI will immediately show the new action.
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ActionDef {
  id: string;
  method: HttpMethod;
  path: string;
  section: string;
  label: string;
  description?: string;
  isReadOnly: boolean;
  isSystem?: boolean;
}

export const ADMIN_ACTIONS: readonly ActionDef[] = [
  // ── System (auth/TOTP — always on, not manageable via RBAC UI) ────────────
  { id: "auth.login",        method: "POST",   path: "/api/admin/auth",                    section: "system",   label: "Admin Login",                isReadOnly: false, isSystem: true },
  { id: "auth.logout",       method: "DELETE", path: "/api/admin/auth",                    section: "system",   label: "Admin Logout",               isReadOnly: false, isSystem: true },
  { id: "auth.session",      method: "GET",    path: "/api/admin/auth",                    section: "system",   label: "Check Session",              isReadOnly: true,  isSystem: true },
  { id: "auth.totp.setup",   method: "POST",   path: "/api/admin/totp/setup",              section: "system",   label: "TOTP Setup",                 isReadOnly: false, isSystem: true },
  { id: "auth.totp.verify",  method: "POST",   path: "/api/admin/totp/verify-setup",       section: "system",   label: "TOTP Verify Setup",          isReadOnly: false, isSystem: true },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  { id: "dashboard.stats",   method: "GET",    path: "/api/admin/dashboard",               section: "dashboard", label: "View Dashboard Stats",       isReadOnly: true  },

  // ── Activity Log ──────────────────────────────────────────────────────────
  { id: "activity.list",     method: "GET",    path: "/api/admin/activity-log",            section: "activity",  label: "Read Activity Log",          isReadOnly: true  },

  // ── Contacts ──────────────────────────────────────────────────────────────
  { id: "contacts.list",     method: "GET",    path: "/api/admin/contacts",                section: "contacts",  label: "List Contacts",              isReadOnly: true  },
  { id: "contacts.read",     method: "GET",    path: "/api/admin/contacts/[id]",           section: "contacts",  label: "Read Contact",               isReadOnly: true  },
  { id: "contacts.update",   method: "PATCH",  path: "/api/admin/contacts/[id]",           section: "contacts",  label: "Update Contact",             isReadOnly: false },
  { id: "contacts.delete",   method: "DELETE", path: "/api/admin/contacts/[id]",           section: "contacts",  label: "Delete Contact",             isReadOnly: false },

  // ── Careers ───────────────────────────────────────────────────────────────
  { id: "careers.list",      method: "GET",    path: "/api/admin/careers",                 section: "careers",   label: "List Applications",          isReadOnly: true  },
  { id: "careers.read",      method: "GET",    path: "/api/admin/careers/[id]",            section: "careers",   label: "Read Application",           isReadOnly: true  },
  { id: "careers.update",    method: "PATCH",  path: "/api/admin/careers/[id]",            section: "careers",   label: "Update Application",         isReadOnly: false },
  { id: "careers.delete",    method: "DELETE", path: "/api/admin/careers/[id]",            section: "careers",   label: "Delete Application",         isReadOnly: false },

  // ── Chats ─────────────────────────────────────────────────────────────────
  { id: "chats.list",        method: "GET",    path: "/api/admin/chats",                   section: "chats",     label: "List Chat Leads",            isReadOnly: true  },
  { id: "chats.read",        method: "GET",    path: "/api/admin/chats/[id]",              section: "chats",     label: "Read Chat Lead",             isReadOnly: true  },
  { id: "chats.delete",      method: "DELETE", path: "/api/admin/chats/[id]",              section: "chats",     label: "Delete Chat Lead",           isReadOnly: false },

  // ── NGO ───────────────────────────────────────────────────────────────────
  { id: "ngo.list",          method: "GET",    path: "/api/admin/ngo",                     section: "ngo",       label: "List NGO Applications",      isReadOnly: true  },
  { id: "ngo.read",          method: "GET",    path: "/api/admin/ngo/[id]",                section: "ngo",       label: "Read NGO Application",       isReadOnly: true  },
  { id: "ngo.update",        method: "PATCH",  path: "/api/admin/ngo/[id]",                section: "ngo",       label: "Update NGO Application",     isReadOnly: false },
  { id: "ngo.delete",        method: "DELETE", path: "/api/admin/ngo/[id]",                section: "ngo",       label: "Delete NGO Application",     isReadOnly: false },

  // ── Notifications ─────────────────────────────────────────────────────────
  { id: "notifications.list", method: "GET",   path: "/api/admin/notifications",           section: "notifications", label: "List Notifications",     isReadOnly: true  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  { id: "staff.list",            method: "GET",    path: "/api/admin/staff",                      section: "staff", label: "List Staff",                isReadOnly: true  },
  { id: "staff.create",          method: "POST",   path: "/api/admin/staff",                      section: "staff", label: "Create Staff",              isReadOnly: false },
  { id: "staff.read",            method: "GET",    path: "/api/admin/staff/[id]",                 section: "staff", label: "Read Staff Member",         isReadOnly: true  },
  { id: "staff.update",          method: "PATCH",  path: "/api/admin/staff/[id]",                 section: "staff", label: "Update Staff Member",       isReadOnly: false },
  { id: "staff.delete",          method: "DELETE", path: "/api/admin/staff/[id]",                 section: "staff", label: "Delete Staff Member",       isReadOnly: false },
  { id: "staff.reset_password",  method: "POST",   path: "/api/admin/staff/[id]/reset-password",  section: "staff", label: "Reset Staff Password",      isReadOnly: false },
  { id: "staff.policy.read",     method: "GET",    path: "/api/admin/staff/[id]/policy",          section: "staff", label: "Read Staff Mail Policy",    isReadOnly: true  },
  { id: "staff.policy.update",   method: "PUT",    path: "/api/admin/staff/[id]/policy",          section: "staff", label: "Update Staff Mail Policy",  isReadOnly: false },
  { id: "upload.staff_image",    method: "POST",   path: "/api/admin/upload",                     section: "staff", label: "Upload Staff Image",        isReadOnly: false },

  // ── Mail Policy ───────────────────────────────────────────────────────────
  { id: "mail_policy.read",   method: "GET", path: "/api/admin/policy/global",             section: "mail_policy", label: "Read Global Mail Policy",   isReadOnly: true  },
  { id: "mail_policy.update", method: "PUT", path: "/api/admin/policy/global",             section: "mail_policy", label: "Update Global Mail Policy", isReadOnly: false },

  // ── Mailbox (staff email impersonation) ───────────────────────────────────
  { id: "mailbox.list",    method: "GET",    path: "/api/admin/outbox",                    section: "mailbox",  label: "List Staff Outbox",          isReadOnly: true  },
  { id: "mailbox.read",    method: "GET",    path: "/api/admin/outbox/[id]",               section: "mailbox",  label: "Read Staff Email",           isReadOnly: true  },
  { id: "mailbox.send",    method: "POST",   path: "/api/admin/outbox/[id]",               section: "mailbox",  label: "Send Staff Email",           isReadOnly: false },
  { id: "mailbox.delete",  method: "DELETE", path: "/api/admin/outbox/[id]",               section: "mailbox",  label: "Delete Staff Email",         isReadOnly: false },

  // ── Database Viewer ───────────────────────────────────────────────────────
  { id: "database.tables",     method: "GET", path: "/api/admin/database",                section: "database", label: "List DB Tables",             isReadOnly: true  },
  { id: "database.table.read", method: "GET", path: "/api/admin/database/[table]",        section: "database", label: "Read DB Table",              isReadOnly: true  },

  // ── Invoices ──────────────────────────────────────────────────────────────
  { id: "invoice.list",              method: "GET",    path: "/api/admin/invoices",                        section: "invoice", label: "List Invoices",             isReadOnly: true  },
  { id: "invoice.create",            method: "POST",   path: "/api/admin/invoices",                        section: "invoice", label: "Create Invoice",            isReadOnly: false },
  { id: "invoice.read",              method: "GET",    path: "/api/admin/invoices/[id]",                   section: "invoice", label: "Read Invoice",              isReadOnly: true  },
  { id: "invoice.update",            method: "PATCH",  path: "/api/admin/invoices/[id]",                   section: "invoice", label: "Update Invoice",            isReadOnly: false },
  { id: "invoice.delete",            method: "DELETE", path: "/api/admin/invoices/[id]",                   section: "invoice", label: "Delete Invoice",            isReadOnly: false },
  { id: "invoice.pdf.generate",      method: "POST",   path: "/api/admin/invoices/[id]/pdf",               section: "invoice", label: "Generate Invoice PDF",      isReadOnly: false },
  { id: "invoice.pdf.download",      method: "GET",    path: "/api/admin/invoices/[id]/pdf",               section: "invoice", label: "Download Invoice PDF",      isReadOnly: true  },
  { id: "invoice.email.send",        method: "POST",   path: "/api/admin/invoices/[id]/email",             section: "invoice", label: "Email Invoice to Client",   isReadOnly: false },
  { id: "invoice.email.logs",        method: "GET",    path: "/api/admin/invoices/[id]/email",             section: "invoice", label: "View Invoice Email Logs",   isReadOnly: true  },
  { id: "invoice.lock",              method: "POST",   path: "/api/admin/invoices/[id]/lock",              section: "invoice", label: "Lock / Unlock Invoice",     isReadOnly: false },
  { id: "invoice.sign.initiate",     method: "POST",   path: "/api/admin/invoices/[id]/sign",              section: "invoice", label: "Initiate eSign",            isReadOnly: false },
  { id: "invoice.sign.status",       method: "GET",    path: "/api/admin/invoices/[id]/sign",              section: "invoice", label: "View eSign Status",         isReadOnly: true  },
  { id: "invoice.versions.list",     method: "GET",    path: "/api/admin/invoices/[id]/versions",          section: "invoice", label: "List PDF Versions",         isReadOnly: true  },
  { id: "invoice.versions.download", method: "POST",   path: "/api/admin/invoices/[id]/versions",          section: "invoice", label: "Download PDF Version",      isReadOnly: false },
  { id: "invoice.next_number",       method: "GET",    path: "/api/admin/invoices/next-number",            section: "invoice", label: "Peek Next Invoice Number",  isReadOnly: true  },
  { id: "invoice_clients.list",      method: "GET",    path: "/api/admin/invoice-clients",                 section: "invoice", label: "List Invoice Clients",      isReadOnly: true  },
  { id: "invoice_clients.create",    method: "POST",   path: "/api/admin/invoice-clients",                 section: "invoice", label: "Create Invoice Client",     isReadOnly: false },
  { id: "invoice_clients.update",    method: "PATCH",  path: "/api/admin/invoice-clients/[id]",            section: "invoice", label: "Update Invoice Client",     isReadOnly: false },
  { id: "invoice_clients.delete",    method: "DELETE", path: "/api/admin/invoice-clients/[id]",            section: "invoice", label: "Delete Invoice Client",     isReadOnly: false },
  { id: "invoice_payment.list",      method: "GET",    path: "/api/admin/invoice-payment-profiles",        section: "invoice", label: "List Payment Profiles",     isReadOnly: true  },
  { id: "invoice_payment.create",    method: "POST",   path: "/api/admin/invoice-payment-profiles",        section: "invoice", label: "Create Payment Profile",    isReadOnly: false },
  { id: "invoice_payment.update",    method: "PATCH",  path: "/api/admin/invoice-payment-profiles/[id]",   section: "invoice", label: "Update Payment Profile",    isReadOnly: false },
  { id: "invoice_payment.delete",    method: "DELETE", path: "/api/admin/invoice-payment-profiles/[id]",   section: "invoice", label: "Delete Payment Profile",    isReadOnly: false },
  { id: "invoice_company.read",      method: "GET",    path: "/api/admin/invoice-company-profile",         section: "invoice", label: "Read Company Profile",      isReadOnly: true  },
  { id: "invoice_company.update",    method: "PUT",    path: "/api/admin/invoice-company-profile",         section: "invoice", label: "Update Company Profile",    isReadOnly: false },

  // ── RBAC (self-referential — deadlock-protected in toggle endpoint) ────────
  { id: "rbac.users.list",         method: "GET",    path: "/api/admin/rbac/users",                 section: "rbac", label: "List Admin Users",           isReadOnly: true  },
  { id: "rbac.users.create",       method: "POST",   path: "/api/admin/rbac/users",                 section: "rbac", label: "Create Admin User",          isReadOnly: false },
  { id: "rbac.users.read",         method: "GET",    path: "/api/admin/rbac/users/[id]",            section: "rbac", label: "Read Admin User",            isReadOnly: true  },
  { id: "rbac.users.update",       method: "PATCH",  path: "/api/admin/rbac/users/[id]",            section: "rbac", label: "Update Admin User",          isReadOnly: false },
  { id: "rbac.users.delete",       method: "DELETE", path: "/api/admin/rbac/users/[id]",            section: "rbac", label: "Delete Admin User",          isReadOnly: false },
  { id: "rbac.users.roles.update", method: "PUT",    path: "/api/admin/rbac/users/[id]/roles",      section: "rbac", label: "Assign / Remove User Roles", isReadOnly: false },
  { id: "rbac.roles.list",         method: "GET",    path: "/api/admin/rbac/roles",                 section: "rbac", label: "List Roles",                 isReadOnly: true  },
  { id: "rbac.roles.create",       method: "POST",   path: "/api/admin/rbac/roles",                 section: "rbac", label: "Create Role",                isReadOnly: false },
  { id: "rbac.roles.read",         method: "GET",    path: "/api/admin/rbac/roles/[id]",            section: "rbac", label: "Read Role",                  isReadOnly: true  },
  { id: "rbac.roles.update",       method: "PATCH",  path: "/api/admin/rbac/roles/[id]",            section: "rbac", label: "Update Role",                isReadOnly: false },
  { id: "rbac.roles.delete",       method: "DELETE", path: "/api/admin/rbac/roles/[id]",            section: "rbac", label: "Delete Role",                isReadOnly: false },
  { id: "rbac.roles.permissions",  method: "PUT",    path: "/api/admin/rbac/roles/[id]/permissions",section: "rbac", label: "Edit Role Permissions",      isReadOnly: false },
  { id: "rbac.actions.list",       method: "GET",    path: "/api/admin/rbac/actions",               section: "rbac", label: "List Actions",               isReadOnly: true  },
  { id: "rbac.actions.toggle",     method: "PATCH",  path: "/api/admin/rbac/actions/[id]",          section: "rbac", label: "Toggle Action Enabled",      isReadOnly: false },
] as const;

export type ActionId = typeof ADMIN_ACTIONS[number]["id"];

/** All actions grouped by section, sorted alphabetically within each section. */
export function getActionsBySection(): Record<string, ActionDef[]> {
  const map: Record<string, ActionDef[]> = {};
  for (const action of ADMIN_ACTIONS) {
    if (!map[action.section]) map[action.section] = [];
    map[action.section].push(action as ActionDef);
  }
  return map;
}

/** Look up an action definition by its stable ID. */
export function getActionDef(id: string): ActionDef | undefined {
  return ADMIN_ACTIONS.find((a) => a.id === id) as ActionDef | undefined;
}
