import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectClientInfo } from "@/utils/clientInfo";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const { ip, deviceInfo } = collectClientInfo(req);

    const thread = await prisma.chatThread.upsert({
      where: { token },
      create: { token, ipAddress: ip, deviceInfo: deviceInfo as object | undefined },
      update: {},
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ threadId: thread.id, createdAt: thread.createdAt });
  } catch (err) {
    console.error("[chat/thread]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
