import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { TABLE_CONFIGS } from "@/lib/adminDb";

/** GET /api/admin/database — table list with row counts */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tables = await Promise.all(
    TABLE_CONFIGS.map(async (t) => ({
      name: t.name,
      label: t.label,
      description: t.description,
      group: t.group,
      count: await (prisma as Record<string, any>)[t.modelKey].count(),
    }))
  );

  return NextResponse.json({ tables });
}
