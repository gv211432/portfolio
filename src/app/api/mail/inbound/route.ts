/**
 * POST /api/mail/inbound
 *
 * Webhook called by the AWS Lambda after it parses a raw .eml from S3.
 * Auth: x-api-key must equal MAIL_WEBHOOK_API_KEY.
 *
 * The payload is the fully-parsed structured email. We do NOT store raw body
 * here — that stays in S3 at `s3Key`. We store only metadata + neutralised
 * plain text for search.
 *
 * Idempotency: one Email row per (staffId, messageId). Duplicate Lambda
 * deliveries no-op.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { MAIL_ENV } from "@/lib/mail/env";
import { htmlToText, makeSnippet } from "@/lib/mail/text";
import { assignThread } from "@/lib/mail/threading";
import { logActivity, Activity } from "@/lib/mail/activity";

interface Addr { email: string; name?: string }
interface InboundAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  s3Key: string;
  contentId?: string;
}
interface InboundPayload {
  messageId: string;
  s3Key: string;
  sizeBytes?: number;
  date?: string;
  from?: Addr;
  to: Addr[];
  cc?: Addr[];
  bcc?: Addr[];
  subject?: string;
  text?: string;
  html?: string;
  snippet?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: InboundAttachment[];
}

// Hash both sides to a fixed-length digest so timingSafeEqual always operates
// on equal-length buffers and no string-length information leaks.
function safeKeyEqual(provided: string, expected: string): boolean {
  const k = Buffer.from("webhook-key-compare", "utf8");
  const h1 = createHmac("sha256", k).update(provided).digest();
  const h2 = createHmac("sha256", k).update(expected).digest();
  return timingSafeEqual(h1, h2);
}


export async function POST(req: NextRequest) {
  const providedKey = req.headers.get("x-api-key") ?? "";
  if (!safeKeyEqual(providedKey, MAIL_ENV.WEBHOOK_API_KEY)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: InboundPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.messageId || !payload.s3Key || !Array.isArray(payload.to) || payload.to.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rawText = payload.text ?? (payload.html ? htmlToText(payload.html) : "");
  const bodyText = rawText.trim();
  const snippet = payload.snippet?.slice(0, 499) ?? makeSnippet(bodyText);
  const createdAt = payload.date ? new Date(payload.date) : new Date();

  // All unique recipients (To + Cc + Bcc) — we look each one up and insert
  // one Email row per matching staff mailbox.
  const allRecipients = [...payload.to, ...(payload.cc ?? []), ...(payload.bcc ?? [])];
  const uniqueAddrs = Array.from(new Set(allRecipients.map((r) => r.email.toLowerCase().trim())));

  const addresses = await prisma.staffEmailAddress.findMany({
    where: { email: { in: uniqueAddrs } },
    include: { staff: true },
  });

  // Ignore unknown recipients (per spec).
  if (addresses.length === 0) {
    await logActivity({
      actorType: "SYSTEM",
      action: Activity.SystemInboundMail,
      metadata: { messageId: payload.messageId, dropped: true, reason: "no_matching_recipients" },
    });
    return NextResponse.json({ ok: true, delivered: 0, reason: "no_matching_recipients" });
  }

  const results: { staffId: string; emailId: string; status: "created" | "duplicate" }[] = [];

  for (const addr of addresses) {
    if (addr.staff.status !== "ACTIVE") continue;

    // Idempotency check
    const existing = await prisma.email.findUnique({
      where: { staffId_messageId: { staffId: addr.staffId, messageId: payload.messageId } },
      select: { id: true },
    });
    if (existing) {
      results.push({ staffId: addr.staffId, emailId: existing.id, status: "duplicate" });
      continue;
    }

    const threadId = await assignThread({
      staffId: addr.staffId,
      subject: payload.subject,
      messageId: payload.messageId,
      inReplyTo: payload.inReplyTo,
      references: payload.references,
      createdAt,
    });

    const created = await prisma.email.create({
      data: {
        staffId: addr.staffId,
        messageId: payload.messageId,
        threadId,
        inReplyTo: payload.inReplyTo ?? null,
        referencesJson: payload.references ?? undefined,
        fromEmail: payload.from?.email ?? "",
        fromName: payload.from?.name ?? null,
        toJson: payload.to as unknown as object,
        ccJson: payload.cc as unknown as object | undefined,
        bccJson: payload.bcc as unknown as object | undefined,
        subject: payload.subject?.slice(0, 1000) ?? null,
        snippet,
        bodyText,
        bodyHtml: payload.html ?? null,
        s3Key: payload.s3Key,
        hasAttachments: !!(payload.attachments && payload.attachments.length),
        sizeBytes: payload.sizeBytes ?? null,
        folder: "INBOX",
        direction: "INBOUND",
        createdAt,
      },
    });

    if (payload.attachments?.length) {
      await prisma.emailAttachment.createMany({
        data: payload.attachments.map((a) => ({
          emailId: created.id,
          filename: a.filename,
          contentType: a.contentType,
          sizeBytes: a.sizeBytes,
          s3Key: a.s3Key,
          contentId: a.contentId ?? null,
        })),
      });
    }

    results.push({ staffId: addr.staffId, emailId: created.id, status: "created" });
  }

  await logActivity({
    actorType: "SYSTEM",
    action: Activity.SystemInboundMail,
    targetType: "Email",
    targetId: payload.messageId,
    metadata: {
      messageId: payload.messageId,
      deliveredTo: results.filter((r) => r.status === "created").length,
      duplicates: results.filter((r) => r.status === "duplicate").length,
    },
  });

  return NextResponse.json({ ok: true, results });
}
