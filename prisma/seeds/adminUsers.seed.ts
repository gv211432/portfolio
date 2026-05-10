import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

interface DefaultUser {
  username:    string;
  displayName: string;
  password:    string;  // plaintext — hashed before insert; change via RBAC UI after first login
  roleNames:   string[];
}

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const DEFAULT_USERS: DefaultUser[] = [
  {
    username:    "komal",
    displayName: "Komal (Super Admin)",
    password:    process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe@2025!",
    roleNames:   ["SUPER_MANAGER", "RBAC_MANAGER"],
  },
  {
    username:    "hr",
    displayName: "HR Manager",
    password:    process.env.HR_ADMIN_PASSWORD ?? randomPassword(),
    roleNames:   ["STAFF_MANAGER", "EMAIL_IMPERSONATOR", "NOTIFICATION_READER"],
  },
  {
    username:    "ca",
    displayName: "CA / Finance",
    password:    process.env.CA_ADMIN_PASSWORD ?? randomPassword(),
    roleNames:   ["INVOICE_MANAGER", "DASHBOARD_READER"],
  },
  {
    username:    "security",
    displayName: "Security Officer",
    password:    process.env.SECURITY_ADMIN_PASSWORD ?? randomPassword(),
    roleNames:   [
      "ACTIVITY_READER",
      "EMAIL_IMPERSONATOR",
      "CONTACT_READER",
      "CAREERS_READER",
      "CHATS_READER",
      "DB_READER",
      "NOTIFICATION_READER",
    ],
  },
];

export async function seedAdminUsers(prisma: PrismaClient) {
  console.log("  → Syncing admin users...");
  const generatedPasswords: { username: string; password: string }[] = [];

  for (const def of DEFAULT_USERS) {
    const existing = await prisma.adminUser.findUnique({ where: { username: def.username } });

    let userId: string;
    if (!existing) {
      const hash = await bcrypt.hash(def.password, 12);
      const created = await prisma.adminUser.create({
        data: {
          username:    def.username,
          displayName: def.displayName,
          passwordHash: hash,
          isActive:    true,
        },
      });
      userId = created.id;
      generatedPasswords.push({ username: def.username, password: def.password });
      console.log(`     Created admin user: ${def.username}`);
    } else {
      // Update displayName only — never overwrite password of existing user
      await prisma.adminUser.update({
        where: { id: existing.id },
        data: { displayName: def.displayName },
      });
      userId = existing.id;
    }

    // Ensure required roles are assigned (additive only)
    for (const roleName of def.roleNames) {
      const role = await prisma.adminRole.findUnique({ where: { name: roleName } });
      if (!role) { console.warn(`     ⚠ Role not found: ${roleName}`); continue; }

      const already = await prisma.adminUserRole.findUnique({
        where: { userId_roleId: { userId, roleId: role.id } },
      });
      if (!already) {
        await prisma.adminUserRole.create({ data: { userId, roleId: role.id } });
      }
    }
  }

  if (generatedPasswords.length > 0) {
    console.log("\n  ┌── GENERATED PASSWORDS (save these now — shown only once) ──────────");
    for (const { username, password } of generatedPasswords) {
      console.log(`  │  ${username.padEnd(12)} ${password}`);
    }
    console.log("  └───────────────────────────────────────────────────────────────────\n");
  }
}

/** Called on app startup — ensures at least one active SUPER_MANAGER exists. */
export async function ensureSuperAdmin(prisma: PrismaClient) {
  const count = await prisma.adminUser.count({
    where: {
      isActive: true,
      roles: { some: { role: { name: "SUPER_MANAGER" } } },
    },
  });

  if (count > 0) return;

  console.warn("⚠  No active SUPER_MANAGER found — creating emergency super admin.");

  const username = process.env.SUPER_ADMIN_USERNAME ?? "superadmin";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe@2025!";
  const hash     = await bcrypt.hash(password, 12);

  const superRole = await prisma.adminRole.findUnique({ where: { name: "SUPER_MANAGER" } });
  if (!superRole) {
    console.error("⛔  SUPER_MANAGER role missing — run seed first.");
    return;
  }

  let user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) {
    user = await prisma.adminUser.create({
      data: { username, displayName: "Super Admin", passwordHash: hash, isActive: true },
    });
  }

  await prisma.adminUserRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superRole.id } },
    update: {},
    create: { userId: user.id, roleId: superRole.id },
  });

  console.warn(`⚠  Emergency super admin created: username="${username}" password="${password}"`);
  console.warn("   Change this password immediately via the RBAC admin panel.");
}
