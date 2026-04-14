/**
 * DELETE /api/mail/labels/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const { id } = await ctx.params;
  await prisma.emailLabel.deleteMany({ where: { id, staffId: r.actor.staffId } });
  return NextResponse.json({ ok: true });
}
