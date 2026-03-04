import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const cursor = searchParams.get("cursor"); // ID of oldest message already loaded
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  try {
    const thread = await prisma.chatThread.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!thread) {
      return NextResponse.json({ messages: [], nextCursor: null });
    }

    // Load messages older than the cursor (for backwards pagination)
    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId: thread.id,
        ...(cursor ? { createdAt: { lt: (await prisma.chatMessage.findUnique({ where: { id: cursor }, select: { createdAt: true } }))?.createdAt } } : {}),
      },
      orderBy: { createdAt: "desc" }, // newest first so we can take limit then reverse
      take: limit + 1,
      select: { id: true, role: true, content: true, createdAt: true },
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    // Return in chronological order (oldest first for display)
    const ordered = messages.reverse();
    const nextCursor = hasMore ? ordered[0].id : null;

    return NextResponse.json({ messages: ordered, nextCursor });
  } catch (err) {
    console.error("[chat/history]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
