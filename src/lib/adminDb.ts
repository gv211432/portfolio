/**
 * Central config for the admin database viewer.
 * Defines every table: Prisma model key, display hints, security exclusions, and search fields.
 * This is the single place to update when the schema changes.
 */

export interface TableConfig {
  /** URL-safe identifier, matches the [table] route param */
  name: string;
  /** Prisma client property key (camelCase) */
  modelKey: string;
  /** Human-readable label */
  label: string;
  /** One-line description shown in the sidebar */
  description: string;
  /** Fields NEVER sent to the browser (security) */
  excludeFields: string[];
  /** Fields shown as columns in the table view (in order) */
  tableColumns: string[];
  /** Fields that support Prisma orderBy */
  sortableFields: string[];
  /** Text fields used for the search OR clause */
  searchableFields: string[];
  /** Default sort field */
  defaultSort: string;
}

export const TABLE_CONFIGS: TableConfig[] = [
  {
    name: "ContactSubmission",
    modelKey: "contactSubmission",
    label: "Contact Submissions",
    description: "Inbound project enquiries from the contact form",
    excludeFields: [],
    tableColumns: ["name", "email", "budget", "status", "createdAt"],
    sortableFields: ["createdAt", "updatedAt", "name", "email", "status", "budget"],
    searchableFields: ["name", "email", "phone", "message"],
    defaultSort: "createdAt",
  },
  {
    name: "JobApplication",
    modelKey: "jobApplication",
    label: "Job Applications",
    description: "Career applications submitted via the careers site",
    excludeFields: [],
    tableColumns: ["legalName", "email", "jobTitle", "status", "createdAt"],
    sortableFields: ["createdAt", "updatedAt", "legalName", "email", "status", "jobTitle"],
    searchableFields: ["legalName", "email", "jobTitle", "countryOfOrigin", "experience"],
    defaultSort: "createdAt",
  },
  {
    name: "ChatThread",
    modelKey: "chatThread",
    label: "Chat Threads",
    description: "AI chat sessions — one per browser token",
    excludeFields: [],
    tableColumns: ["token", "ipAddress", "createdAt", "updatedAt"],
    sortableFields: ["createdAt", "updatedAt", "ipAddress"],
    searchableFields: ["token", "ipAddress"],
    defaultSort: "createdAt",
  },
  {
    name: "ChatMessage",
    modelKey: "chatMessage",
    label: "Chat Messages",
    description: "Individual messages within chat threads",
    excludeFields: [],
    tableColumns: ["role", "content", "threadId", "createdAt"],
    sortableFields: ["createdAt", "role"],
    searchableFields: ["content", "role"],
    defaultSort: "createdAt",
  },
  {
    name: "ChatLead",
    modelKey: "chatLead",
    label: "Chat Leads",
    description: "Visitor leads captured by the AI chatbot",
    excludeFields: [],
    tableColumns: ["name", "email", "budget", "notified", "createdAt"],
    sortableFields: ["createdAt", "name", "email", "notified"],
    searchableFields: ["name", "email", "telegramHandle", "projectBrief", "budget"],
    defaultSort: "createdAt",
  },
  {
    name: "ChatKVStore",
    modelKey: "chatKVStore",
    label: "KV Store",
    description: "Persistent key-value memory for the AI agent",
    excludeFields: [],
    tableColumns: ["key", "value", "updatedAt"],
    sortableFields: ["createdAt", "updatedAt", "key"],
    searchableFields: ["key", "value"],
    defaultSort: "updatedAt",
  },
  {
    name: "AdminUser",
    modelKey: "adminUser",
    label: "Admin Users",
    description: "Dashboard administrators",
    // passwordHash is NEVER sent to the client
    excludeFields: ["passwordHash"],
    tableColumns: ["username", "createdAt", "lastLoginAt"],
    sortableFields: ["createdAt", "updatedAt", "username"],
    searchableFields: ["username"],
    defaultSort: "createdAt",
  },
];
