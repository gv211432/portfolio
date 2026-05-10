import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/chats/[id] — full thread with all messages */
export async function GET(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "chats.read");
  if (!perm.ok) return perm.response;

  const { id } = await params;

  const thread = await prisma.chatThread.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ thread });
}

/** DELETE /api/admin/chats/[id] — delete single thread + its messages (cascade) */
export async function DELETE(request: NextRequest, { params }: Params) {
  const perm = await requirePermission(request, "chats.delete");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  await prisma.chatThread.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
