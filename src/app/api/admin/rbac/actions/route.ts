import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { getActionsBySection } from "@/lib/admin/actionRegistry";

/** GET /api/admin/rbac/actions — all actions grouped by section, with live isEnabled state */
export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "rbac.actions.list");
  if (!perm.ok) return perm.response;

  const dbActions = await prisma.adminAction.findMany({
    orderBy: [{ section: "asc" }, { id: "asc" }],
    select: {
      id: true, method: true, path: true, section: true, label: true,
      description: true, isReadOnly: true, isEnabled: true, isSystem: true,
      _count: { select: { permissions: true } },
    },
  });

  // Group by section
  const grouped: Record<string, typeof dbActions> = {};
  for (const action of dbActions) {
    if (!grouped[action.section]) grouped[action.section] = [];
    grouped[action.section].push(action);
  }

  // Section order from registry
  const sectionOrder = Object.keys(getActionsBySection());
  const sortedGrouped = Object.fromEntries(
    sectionOrder
      .filter((s) => grouped[s])
      .map((s) => [s, grouped[s]])
      .concat(
        Object.entries(grouped).filter(([s]) => !sectionOrder.includes(s))
      )
  );

  return NextResponse.json({ actions: sortedGrouped, total: dbActions.length });
}
