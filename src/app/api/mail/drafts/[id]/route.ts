/**
 * GET    /api/mail/drafts/[id]
 * PATCH  /api/mail/drafts/[id]   — partial update (autosave)
 * DELETE /api/mail/drafts/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";
import { logAsActor } from "@/lib/mail/mailActor";
import { Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const { id } = await ctx.params;
  const draft = await prisma.emailDraft.findFirst({ where: { id, staffId: r.actor.staffId } });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (Array.isArray(body.to)) data.toJson = body.to;
  if (Array.isArray(body.cc)) data.ccJson = body.cc;
  if (Array.isArray(body.bcc)) data.bccJson = body.bcc;
  if (typeof body.subject === "string") data.subject = body.subject.slice(0, 1000);
  if (typeof body.bodyText === "string") data.bodyText = body.bodyText;
  if (typeof body.bodyHtml === "string") data.bodyHtml = body.bodyHtml;

  const existing = await prisma.emailDraft.findFirst({
    where: { id, staffId: r.actor.staffId }, select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.emailDraft.update({ where: { id }, data });
  await logAsActor(r.actor, Activity.StaffDraftSave, { targetType: "EmailDraft", targetId: id });
  return NextResponse.json({ draft: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req); if (!r.ok) return r.response;
  const { id } = await ctx.params;
  await prisma.emailDraft.deleteMany({ where: { id, staffId: r.actor.staffId } });
  return NextResponse.json({ ok: true });
}
