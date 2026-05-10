import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  const perm = await requirePermission(request, "contacts.list");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const validSortFields = ["createdAt", "updatedAt", "name", "email", "budget", "status"];
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [safeSortBy]: sortOrder },
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  return NextResponse.json({ submissions, total, page, limit, pages: Math.ceil(total / limit) });
}
