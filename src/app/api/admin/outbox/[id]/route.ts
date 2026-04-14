/**
 * GET    /api/admin/outbox/[id] — full blocked message + policy info
 * POST   /api/admin/outbox/[id] — action: { action: "release" | "reject" }
 *                                 release → send via SES despite policy; persist SENT row
 *                                 reject  → mark REJECTED, keep for audit
 * DELETE /api/admin/outbox/[id] — hard delete
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { sendViaSes, type MailAddress } from "@/lib/mail/ses";
import { makeSnippet } from "@/lib/mail/text";
import { assignThread } from "@/lib/mail/threading";
import { logActivity, Activity } from "@/lib/mail/activity";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const item = await prisma.outboxEmail.findUnique({
    where: { id },
    include: { staff: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const action = body.action as string;

  const item = await prisma.outboxEmail.findUnique({
    where: { id },
    include: { staff: { include: { emailAddress: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== "BLOCKED") {
    return NextResponse.json({ error: `Already ${item.status}` }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.outboxEmail.update({
      where: { id },
      data: { status: "DISCARDED", reviewedBy: admin.id, reviewedAt: new Date() },
    });
    await logActivity({
      actorType: "ADMIN",
      actorId: admin.id,
      actorLabel: admin.username,
      action: Activity.AdminOutboxDiscard,
      targetType: "OutboxEmail",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "release") {
    if (!item.staff?.emailAddress) {
      return NextResponse.json({ error: "Sender mailbox missing" }, { status: 400 });
    }
    const from: MailAddress = {
      email: item.fromEmail,
      name: item.staff.displayName ?? `${item.staff.firstName} ${item.staff.lastName}`,
    };
    const to = item.toJson as unknown as MailAddress[];
    const cc = (item.ccJson as unknown as MailAddress[] | null) ?? [];
    const bcc = (item.bccJson as unknown as MailAddress[] | null) ?? [];
    const bodyText = item.bodyText ?? "";

    let sent;
    try {
      sent = await sendViaSes({
        from,
        to, cc, bcc,
        subject: item.subject ?? "",
        bodyText,
        bodyHtml: item.bodyHtml ?? undefined,
      });
    } catch (err) {
      console.error("[outbox release SES]", err);
      return NextResponse.json({ error: "Send failed" }, { status: 502 });
    }

    const now = new Date();
    const threadId = await assignThread({
      staffId: item.staffId,
      subject: item.subject ?? "",
      messageId: sent.messageId,
      createdAt: now,
    });
    await prisma.email.create({
      data: {
        staffId: item.staffId,
        messageId: sent.messageId,
        threadId,
        fromEmail: from.email,
        fromName: from.name ?? null,
        toJson: item.toJson as object,
        ccJson: item.ccJson ?? undefined,
        bccJson: item.bccJson ?? undefined,
        subject: item.subject,
        snippet: makeSnippet(bodyText),
        bodyText,
        s3Key: null,
        folder: "SENT",
        direction: "OUTBOUND",
        isRead: true,
        hasAttachments: false,
        sizeBytes: Buffer.byteLength(bodyText, "utf8"),
        createdAt: now,
      },
    });

    await prisma.outboxEmail.update({
      where: { id },
      data: { status: "RELEASED", reviewedBy: admin.id, reviewedAt: now },
    });
    await logActivity({
      actorType: "ADMIN",
      actorId: admin.id,
      actorLabel: admin.username,
      action: Activity.AdminOutboxRelease,
      targetType: "OutboxEmail",
      targetId: id,
      metadata: { sesMessageId: sent.sesMessageId },
    });

    return NextResponse.json({ ok: true, messageId: sent.messageId });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.outboxEmail.delete({ where: { id } });
  await logActivity({
    actorType: "ADMIN",
    actorId: admin.id,
    actorLabel: admin.username,
    action: Activity.AdminOutboxDiscard,
    targetType: "OutboxEmail",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
