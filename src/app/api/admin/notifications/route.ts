import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  const perm = await requirePermission(request, "notifications.list");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const channel = searchParams.get("channel") ?? undefined;  // EMAIL | TELEGRAM
  const status  = searchParams.get("status")  ?? undefined;  // SENT | FAILED
  const refType = searchParams.get("refType") ?? undefined;
  const search  = searchParams.get("search")  ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const where: Record<string, unknown> = {};
  if (channel) where.channel = channel;
  if (status)  where.status  = status;
  if (refType) where.refType = refType;

  if (search) {
    where.OR = [
      { subject:  { contains: search, mode: "insensitive" } },
      { body:     { contains: search, mode: "insensitive" } },
      { toEmail:  { contains: search, mode: "insensitive" } },
      { toName:   { contains: search, mode: "insensitive" } },
      { refType:  { contains: search, mode: "insensitive" } },
      { refId:    { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.notificationLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
}
