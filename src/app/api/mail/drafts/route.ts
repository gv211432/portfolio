/**
 * GET  /api/mail/drafts        — list drafts
 * POST /api/mail/drafts        — create draft (returns { id })
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";

export async function GET(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const drafts = await prisma.emailDraft.findMany({
    where: { staffId: r.actor.staffId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const body = await req.json().catch(() => ({}));
  const draft = await prisma.emailDraft.create({
    data: {
      staffId: r.actor.staffId,
      toJson: Array.isArray(body.to) ? body.to : [],
      ccJson: Array.isArray(body.cc) ? body.cc : undefined,
      bccJson: Array.isArray(body.bcc) ? body.bcc : undefined,
      subject: typeof body.subject === "string" ? body.subject.slice(0, 1000) : null,
      bodyText: typeof body.bodyText === "string" ? body.bodyText : null,
      bodyHtml: typeof body.bodyHtml === "string" ? body.bodyHtml : null,
      replyToEmailId: typeof body.replyToEmailId === "string" ? body.replyToEmailId : null,
    },
  });
  return NextResponse.json({ draft });
}
