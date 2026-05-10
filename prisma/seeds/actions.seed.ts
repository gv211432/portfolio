import { PrismaClient } from "@prisma/client";
import { ADMIN_ACTIONS } from "../../src/lib/admin/actionRegistry";

export async function seedActions(prisma: PrismaClient) {
  console.log("  → Syncing actions...");
  let created = 0;
  let updated = 0;

  for (const action of ADMIN_ACTIONS) {
    const existing = await prisma.adminAction.findUnique({ where: { id: action.id } });
    if (!existing) {
      await prisma.adminAction.create({
        data: {
          id:          action.id,
          method:      action.method,
          path:        action.path,
          section:     action.section,
          label:       action.label,
          description: action.description ?? null,
          isReadOnly:  action.isReadOnly,
          isSystem:    action.isSystem ?? false,
          isEnabled:   true,
        },
      });
      created++;
    } else {
      // Update label/description/path in case they changed — never change isEnabled
      await prisma.adminAction.update({
        where: { id: action.id },
        data: {
          method:      action.method,
          path:        action.path,
          section:     action.section,
          label:       action.label,
          description: action.description ?? null,
          isReadOnly:  action.isReadOnly,
          isSystem:    action.isSystem ?? false,
        },
      });
      updated++;
    }
  }

  console.log(`     Actions: ${created} created, ${updated} updated`);
}
