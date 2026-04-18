/**
 * GET /api/mail/emails
 *
 * Query: folder=INBOX|SENT|TRASH|DRAFT|SPAM  (default INBOX)
 *        labelId=...  threadId=...  isRead=true|false  isStarred=true|false
 *        page=1  limit=50  asStaffId=... (admin impersonation)
 *        groupByThread=true  → returns one row per thread (latest email).
 *
 * Lightweight payload: no bodyText returned; open a single email for content.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor, logImpersonationViewIfAny } from "@/lib/mail/mailActor";

export async function GET(req: NextRequest) {
  const resolved = await resolveMailActor(req);
  if (!resolved.ok) return resolved.response;
  const { actor } = resolved;

  const sp = new URL(req.url).searchParams;
  const folder = sp.get("folder") ?? "INBOX";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50")));
  const labelId = sp.get("labelId");
  const threadId = sp.get("threadId");
  const isRead = sp.get("isRead");
  const isStarred = sp.get("isStarred");
  const groupByThread = sp.get("groupByThread") === "true";

  const where: Record<string, unknown> = { staffId: actor.staffId };
  // "STARRED" is a virtual folder — skip folder filter, force isStarred=true
  if (folder === "STARRED") {
    where.isStarred = true;
  } else {
    if (!threadId) where.folder = folder;
  }
  if (threadId) where.threadId = threadId;
  if (labelId) where.labels = { some: { labelId } };
  if (isRead !== null) where.isRead = isRead === "true";
  if (isStarred !== null && folder !== "STARRED") where.isStarred = isStarred === "true";

  // Log admin impersonation mailbox view (once per request).
  await logImpersonationViewIfAny(actor, actor.staffId, "mailbox");

  if (groupByThread) {
    // Fetch threads participating in this folder, sorted by latest mail in folder.
    const rows = await prisma.email.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit * 3, // overfetch to group
      skip: (page - 1) * limit,
    });

    const seen = new Set<string>();
    const threads: typeof rows = [];
    for (const r of rows) {
      const k = r.threadId ?? r.id;
      if (seen.has(k)) continue;
      seen.add(k);
      threads.push(r);
      if (threads.length >= limit) break;
    }

    const emails = threads.map(serialize);
    return NextResponse.json({ emails, page, limit, grouped: true });
  }

  const [rows, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: threadId ? { createdAt: "asc" } : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { labels: { include: { label: true } } },
    }),
    prisma.email.count({ where }),
  ]);

  return NextResponse.json({
    emails: rows.map(serialize),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

function serialize(e: {
  id: string; createdAt: Date; messageId: string; threadId: string | null;
  fromEmail: string; fromName: string | null; toJson: unknown; ccJson: unknown;
  subject: string | null; snippet: string; folder: string; isRead: boolean;
  isStarred: boolean; hasAttachments: boolean; direction: string;
  labels?: { label: { id: string; name: string; color: string | null } }[];
}) {
  return {
    id: e.id,
    createdAt: e.createdAt,
    messageId: e.messageId,
    threadId: e.threadId,
    from: { email: e.fromEmail, name: e.fromName },
    to: e.toJson,
    cc: e.ccJson,
    subject: e.subject,
    snippet: e.snippet,
    folder: e.folder,
    isRead: e.isRead,
    isStarred: e.isStarred,
    hasAttachments: e.hasAttachments,
    direction: e.direction,
    labels: e.labels?.map((l) => l.label),
  };
}
