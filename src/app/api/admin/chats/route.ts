import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(request: NextRequest) {
  const perm = await requirePermission(request, "chats.list");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search") ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  // Money-related patterns for fuzzy filtering
  const MONEY_KEYWORDS = [
    "$",
    "usd",
    "budget",
    "invest",
    "worth",
    "price",
    "cost",
    "k usd",
    "million",
    "billion",
    "pay",
    "fee",
    "quote",
    "proposal",
  ];

  const moneyFilter = searchParams.get("moneyOnly") === "true";

  // Thread-level search via message content
  let threadIds: string[] | undefined;
  if (search || moneyFilter) {
    const searchTerm = search ?? MONEY_KEYWORDS.join("|");
    const matchedMessages = await prisma.chatMessage.findMany({
      where: {
        content: moneyFilter && !search
          ? { contains: "$", mode: "insensitive" } // simple money filter
          : { contains: search!, mode: "insensitive" },
      },
      select: { threadId: true },
      distinct: ["threadId"],
    });
    threadIds = matchedMessages.map((m) => m.threadId);
    if (threadIds.length === 0) {
      return NextResponse.json({ threads: [], total: 0, page, limit, pages: 0 });
    }
  }

  const where: Record<string, unknown> = threadIds ? { id: { in: threadIds } } : {};

  const [threads, total] = await Promise.all([
    prisma.chatThread.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    }),
    prisma.chatThread.count({ where }),
  ]);

  return NextResponse.json({ threads, total, page, limit, pages: Math.ceil(total / limit) });
}

/** DELETE /api/admin/chats — bulk delete old threads */
export async function DELETE(request: NextRequest) {
  const perm = await requirePermission(request, "chats.delete");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(request.url);
  const olderThanDays = parseInt(searchParams.get("olderThanDays") ?? "30");

  if (isNaN(olderThanDays) || olderThanDays < 1) {
    return NextResponse.json({ error: "olderThanDays must be ≥ 1" }, { status: 400 });
  }

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const { count } = await prisma.chatThread.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ success: true, deleted: count });
}
