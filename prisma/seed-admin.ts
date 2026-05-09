/**
 * Admin user seed script.
 * Usage: bun run db:seed
 *
 * Required env vars:
 *   ADMIN_USERNAME  — defaults to "gaurav"
 *   ADMIN_PASSWORD  — required, no default
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "gaurav";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD env var is required.\n" +
        "Set it in your .env file and re-run: bun run db:seed"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, updatedAt: new Date() },
    create: { username, passwordHash },
  });

  console.log(`✅ Admin user seeded`);
  console.log(`   username : ${admin.username}`);
  console.log(`   id       : ${admin.id}`);
  console.log(`   created  : ${admin.createdAt.toISOString()}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
