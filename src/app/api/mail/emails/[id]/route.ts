/**
 * GET    /api/mail/emails/[id]  — full email (body, attachments w/ signed URLs).
 *                                  Marks as read; logs admin impersonation opens.
 * PATCH  /api/mail/emails/[id]  — update { isRead?, isStarred?, folder?, labelIds? }
 * DELETE /api/mail/emails/[id]  — soft-delete (move to TRASH) if not already there;
 *                                  hard-delete from S3 + DB when already in TRASH.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  resolveMailActor,
  logImpersonationViewIfAny,
  logAsActor,
} from "@/lib/mail/mailActor";
import { signedAttachmentUrl, deleteObject } from "@/lib/mail/s3";
import { Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;
  const { id } = await ctx.params;

  const email = await prisma.email.findFirst({
    where: { id, staffId: actor.staffId },
    include: { attachments: true, labels: { include: { label: true } } },
  });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Signed URLs for attachments (15-min)
  const attachments = await Promise.all(
    email.attachments.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      contentType: a.contentType,
      sizeBytes: a.sizeBytes,
      contentId: a.contentId,
      url: await signedAttachmentUrl(a.s3Key),
    })),
  );

  // Auto-mark read on first open (only for staff, not admin impersonation)
  if (!email.isRead && !actor.viewingAsAdmin) {
    await prisma.email.update({ where: { id }, data: { isRead: true } });
  }

  await logAsActor(actor, Activity.StaffEmailOpen, { targetType: "Email", targetId: id });
  await logImpersonationViewIfAny(actor, id, "email");

  return NextResponse.json({
    email: {
      id: email.id,
      createdAt: email.createdAt,
      messageId: email.messageId,
      threadId: email.threadId,
      inReplyTo: email.inReplyTo,
      references: email.referencesJson,
      from: { email: email.fromEmail, name: email.fromName },
      to: email.toJson,
      cc: email.ccJson,
      bcc: email.bccJson,
      subject: email.subject,
      bodyText: email.bodyText,
      html: email.bodyHtml ?? undefined,
      s3Key: email.s3Key, // admin can fetch raw if needed via separate endpoint
      folder: email.folder,
      isRead: actor.viewingAsAdmin ? email.isRead : true,
      isStarred: email.isStarred,
      direction: email.direction,
      hasAttachments: email.hasAttachments,
      sizeBytes: email.sizeBytes,
      attachments,
      labels: email.labels.map((l) => l.label),
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;
  const { id } = await ctx.params;

  const body = await req.json();
  const email = await prisma.email.findFirst({
    where: { id, staffId: actor.staffId },
    select: { id: true, folder: true },
  });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.isRead === "boolean") data.isRead = body.isRead;
  if (typeof body.isStarred === "boolean") data.isStarred = body.isStarred;
  if (typeof body.folder === "string" && ["INBOX","SENT","TRASH","DRAFT","SPAM"].includes(body.folder)) {
    data.folder = body.folder;
  }

  if (Object.keys(data).length) {
    await prisma.email.update({ where: { id }, data });
  }

  if (Array.isArray(body.labelIds)) {
    await prisma.emailLabelOnEmail.deleteMany({ where: { emailId: id } });
    if (body.labelIds.length) {
      // verify labels belong to this staff
      const valid = await prisma.emailLabel.findMany({
        where: { id: { in: body.labelIds }, staffId: actor.staffId },
        select: { id: true },
      });
      await prisma.emailLabelOnEmail.createMany({
        data: valid.map((l) => ({ emailId: id, labelId: l.id })),
      });
    }
  }

  if (data.folder === "TRASH") {
    await logAsActor(actor, Activity.StaffEmailTrash, { targetType: "Email", targetId: id });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;
  const { id } = await ctx.params;

  const email = await prisma.email.findFirst({
    where: { id, staffId: actor.staffId },
    include: { attachments: true },
  });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (email.folder !== "TRASH") {
    // First delete → just soft-trash.
    await prisma.email.update({ where: { id }, data: { folder: "TRASH" } });
    await logAsActor(actor, Activity.StaffEmailTrash, { targetType: "Email", targetId: id });
    return NextResponse.json({ ok: true, soft: true });
  }

  // Hard delete: remove attachments from S3 (raw .eml is shared by recipients,
  // so we leave inbound S3 objects alone — cleanup is a separate sweep job).
  for (const a of email.attachments) {
    await deleteObject(a.s3Key).catch((e) => console.error("[s3 attach delete]", e));
  }
  await prisma.email.delete({ where: { id } });

  await logAsActor(actor, Activity.StaffEmailDelete, { targetType: "Email", targetId: id });
  return NextResponse.json({ ok: true, soft: false });
}
