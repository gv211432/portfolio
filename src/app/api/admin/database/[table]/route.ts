import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { TABLE_CONFIG_MAP } from "@/lib/adminDb";

type Params = { params: Promise<{ table: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table } = await params;
  const config = TABLE_CONFIG_MAP[table];
  if (!config) return NextResponse.json({ error: "Unknown table" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sortBy") ?? config.defaultSort;
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  // Build safe orderBy — only allow known non-JSON fields
  const safeSortBy = config.sortableFields.includes(sortBy) ? sortBy : config.defaultSort;

  // Build search where clause
  const where =
    search && config.searchableFields.length > 0
      ? {
          OR: config.searchableFields.map((field) => ({
            [field]: { contains: search, mode: "insensitive" as const },
          })),
        }
      : {};

  const model = (prisma as Record<string, any>)[config.modelKey];

  const [rawRows, total] = await Promise.all([
    model.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
    }),
    model.count({ where }),
  ]);

  // Scrub sensitive fields server-side before sending
  const rows = rawRows.map((row: Record<string, unknown>) => {
    const clean = { ...row };
    for (const f of config.excludeFields) delete clean[f];
    return clean;
  });

  return NextResponse.json({
    rows,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    columns: config.tableColumns,
    sortableFields: config.sortableFields,
  });
}
