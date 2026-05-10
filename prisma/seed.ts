import { PrismaClient } from "@prisma/client";
import { seedActions }    from "./seeds/actions.seed";
import { seedRoles }      from "./seeds/roles.seed";
import { seedAdminUsers } from "./seeds/adminUsers.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Running RBAC seed...\n");

  // Order matters: actions → roles (reference actions) → users (reference roles)
  await seedActions(prisma);
  await seedRoles(prisma);
  await seedAdminUsers(prisma);

  console.log("\n✅  Seed complete.");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
