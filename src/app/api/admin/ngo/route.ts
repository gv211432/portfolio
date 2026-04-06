import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const validSortFields = ["createdAt", "updatedAt", "organizationName", "email", "status"];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { organizationName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { subdomain: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.ngoApplication.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
    }),
    prisma.ngoApplication.count({ where }),
  ]);

  return NextResponse.json({ applications, total, page, limit, pages: Math.ceil(total / limit) });
}
