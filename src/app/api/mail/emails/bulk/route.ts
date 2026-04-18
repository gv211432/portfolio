/**
 * POST /api/mail/emails/bulk
 * Body: { ids: string[], action: BulkAction }
 *
 * Bulk operations on emails owned by the authenticated staff (or impersonated staff).
 * Actions: markRead, markUnread, trash, archive, spam, delete, pin, unpin
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor, logAsActor } from "@/lib/mail/mailActor";
import { deleteObject } from "@/lib/mail/s3";
import { Activity } from "@/lib/mail/activity";

type BulkAction = "markRead" | "markUnread" | "trash" | "archive" | "spam" | "delete" | "pin" | "unpin";

export async function POST(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;

  const body = await req.json();
  const ids: unknown = body.ids;
  const action: unknown = body.action;

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== "string")) {
    return NextResponse.json({ error: "ids must be a non-empty string array" }, { status: 400 });
  }
  const validActions: BulkAction[] = ["markRead", "markUnread", "trash", "archive", "spam", "delete", "pin", "unpin"];
  if (typeof action !== "string" || !validActions.includes(action as BulkAction)) {
    return NextResponse.json({ error: `action must be one of: ${validActions.join(", ")}` }, { status: 400 });
  }

  const typedIds = ids as string[];
  const typedAction = action as BulkAction;

  // Scope to this staff's emails only
  const where = { id: { in: typedIds }, staffId: actor.staffId };

  if (typedAction === "delete") {
    // Hard delete: fetch attachments first, then delete from S3, then DB
    const emails = await prisma.email.findMany({
      where,
      include: { attachments: true },
    });
    for (const email of emails) {
      for (const a of email.attachments) {
        await deleteObject(a.s3Key).catch((e) => console.error("[bulk s3 delete]", e));
      }
    }
    await prisma.email.deleteMany({ where });
    await logAsActor(actor, Activity.StaffEmailDelete, { metadata: { bulkCount: emails.length } });
    return NextResponse.json({ ok: true, affected: emails.length });
  }

  let data: Record<string, unknown> = {};
  let logActivity: (() => Promise<void>) | null = null;

  switch (typedAction) {
    case "markRead":
      data = { isRead: true };
      break;
    case "markUnread":
      data = { isRead: false };
      break;
    case "trash":
      data = { folder: "TRASH" };
      logActivity = () => logAsActor(actor, Activity.StaffEmailTrash, { metadata: { bulkCount: typedIds.length } });
      break;
    case "archive":
      data = { folder: "ARCHIVE" };
      logActivity = () => logAsActor(actor, Activity.StaffEmailArchive, { metadata: { bulkCount: typedIds.length } });
      break;
    case "spam":
      data = { folder: "SPAM" };
      break;
    case "pin":
      data = { isPinned: true };
      break;
    case "unpin":
      data = { isPinned: false };
      break;
  }

  const result = await prisma.email.updateMany({ where, data });
  if (logActivity) await logActivity().catch(console.error);

  return NextResponse.json({ ok: true, affected: result.count });
}
