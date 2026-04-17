/**
 * POST /api/mail/send
 *
 * Body:
 *   { to: Addr[], cc?: Addr[], bcc?: Addr[], subject, bodyText, bodyHtml?,
 *     inReplyTo?, references?[], draftId? }
 *
 * Flow:
 *   1. Resolve actor (staff or admin-as-staff).
 *   2. Evaluate outbound policy against To+Cc+Bcc.
 *   3. If blocked → insert into OutboxEmail(status=BLOCKED), 403 response.
 *   4. Else send via SES, insert Email(folder=SENT) for the sender, delete Draft.
 *
 * Admin impersonation CAN send on behalf of a staff; the action is logged.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor, logAsActor } from "@/lib/mail/mailActor";
import { evaluateOutboundPolicy } from "@/lib/mail/policy";
import { sendViaSes, type MailAddress } from "@/lib/mail/ses";
import { htmlToText, makeSnippet, isValidEmail } from "@/lib/mail/text";
import { assignThread } from "@/lib/mail/threading";
import { Activity } from "@/lib/mail/activity";
import { getObjectBuffer } from "@/lib/mail/s3";
import type { SesAttachment } from "@/lib/mail/ses";

interface Addr { email: string; name?: string }

function normalizeAddrs(list: unknown): Addr[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => {
      if (typeof x === "string") return { email: x.toLowerCase().trim() };
      if (x && typeof x === "object" && typeof (x as Addr).email === "string") {
        return { email: (x as Addr).email.toLowerCase().trim(), name: (x as Addr).name };
      }
      return null;
    })
    .filter((x): x is Addr => !!x && isValidEmail(x.email));
}

export async function POST(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;

  const body = await req.json();
  const to = normalizeAddrs(body.to);
  const cc = normalizeAddrs(body.cc);
  const bcc = normalizeAddrs(body.bcc);
  const subject = typeof body.subject === "string" ? body.subject : "";
  const bodyHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : undefined;
  const bodyText = typeof body.bodyText === "string" && body.bodyText.trim()
    ? body.bodyText
    : bodyHtml ? htmlToText(bodyHtml) : "";
  const inReplyTo = typeof body.inReplyTo === "string" ? body.inReplyTo : undefined;
  const references = Array.isArray(body.references) ? body.references.filter((x: unknown): x is string => typeof x === "string") : undefined;
  const draftId = typeof body.draftId === "string" ? body.draftId : undefined;

  if (to.length === 0) {
    return NextResponse.json({ error: "At least one recipient required" }, { status: 400 });
  }

  // Resolve sender address + name
  const addr = await prisma.staffEmailAddress.findUnique({ where: { staffId: actor.staffId } });
  const staff = await prisma.staff.findUnique({ where: { id: actor.staffId } });
  if (!addr || !staff) {
    return NextResponse.json({ error: "Sender mailbox not found" }, { status: 404 });
  }

  const from: MailAddress = {
    email: addr.email,
    name: staff.displayName ?? `${staff.firstName} ${staff.lastName}`,
  };

  // Policy evaluation
  const allRcpts = [...to, ...cc, ...bcc].map((a) => a.email);
  const policy = await evaluateOutboundPolicy(actor.staffId, allRcpts);

  if (!policy.allowed) {
    const outbox = await prisma.outboxEmail.create({
      data: {
        staffId: actor.staffId,
        fromEmail: from.email,
        toJson: to as unknown as object,
        ccJson: cc.length ? (cc as unknown as object) : undefined,
        bccJson: bcc.length ? (bcc as unknown as object) : undefined,
        subject: subject.slice(0, 1000) || null,
        bodyText,
        bodyHtml: bodyHtml ?? null,
        status: "BLOCKED",
        reason: `${policy.blockedRecipients.length} recipient(s) violate the ${policy.source} allow-list`,
        blockedRecipients: policy.blockedRecipients as unknown as object,
      },
    });

    await logAsActor(actor, Activity.StaffEmailSendBlocked, {
      targetType: "OutboxEmail",
      targetId: outbox.id,
      metadata: {
        blockedRecipients: policy.blockedRecipients,
        allowedDomains: policy.allowedDomains,
        source: policy.source,
      },
    });

    return NextResponse.json(
      {
        error: "Blocked by policy",
        blocked: true,
        outboxId: outbox.id,
        blockedRecipients: policy.blockedRecipients,
        allowedDomains: policy.allowedDomains,
        source: policy.source,
      },
      { status: 403 },
    );
  }

  // Resolve attachments from S3 (uploaded by Compose UI)
  const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
  const sesAttachments: SesAttachment[] = [];
  for (const att of rawAttachments) {
    if (!att.s3Key || typeof att.s3Key !== "string") continue;
    try {
      const content = await getObjectBuffer(att.s3Key);
      sesAttachments.push({
        filename: att.filename ?? "attachment",
        contentType: att.contentType ?? "application/octet-stream",
        content,
      });
    } catch (err) {
      console.error("[mail/send] failed to read attachment", att.s3Key, err);
    }
  }

  // Send via SES
  let sent;
  try {
    sent = await sendViaSes({
      from,
      to, cc, bcc,
      subject,
      bodyText,
      bodyHtml,
      inReplyTo,
      references,
      attachments: sesAttachments.length ? sesAttachments : undefined,
    });
  } catch (err) {
    console.error("[mail/send] SES error", err);
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }

  // Persist SENT row for the sender
  const now = new Date();
  const threadId = await assignThread({
    staffId: actor.staffId,
    subject,
    messageId: sent.messageId,
    inReplyTo,
    references,
    createdAt: now,
  });

  const email = await prisma.email.create({
    data: {
      staffId: actor.staffId,
      messageId: sent.messageId,
      threadId,
      inReplyTo: inReplyTo ?? null,
      referencesJson: references ?? undefined,
      fromEmail: from.email,
      fromName: from.name ?? null,
      toJson: to as unknown as object,
      ccJson: cc.length ? (cc as unknown as object) : undefined,
      bccJson: bcc.length ? (bcc as unknown as object) : undefined,
      subject: subject.slice(0, 1000) || null,
      snippet: makeSnippet(bodyText),
      bodyText,
      bodyHtml: bodyHtml ?? null,
      s3Key: null,
      folder: "SENT",
      direction: "OUTBOUND",
      isRead: true,
      hasAttachments: sesAttachments.length > 0,
      sizeBytes: Buffer.byteLength(bodyText, "utf8"),
      createdAt: now,
    },
  });

  // Save outbound attachment records
  if (rawAttachments.length > 0) {
    await prisma.emailAttachment.createMany({
      data: rawAttachments
        .filter((a: { s3Key?: string }) => a.s3Key)
        .map((a: { s3Key: string; filename?: string; contentType?: string; sizeBytes?: number }) => ({
          emailId: email.id,
          filename: a.filename ?? "attachment",
          contentType: a.contentType ?? "application/octet-stream",
          sizeBytes: a.sizeBytes ?? 0,
          s3Key: a.s3Key,
        })),
    });
  }

  if (draftId) {
    await prisma.emailDraft.deleteMany({ where: { id: draftId, staffId: actor.staffId } });
  }

  await logAsActor(actor, Activity.StaffEmailSend, {
    targetType: "Email",
    targetId: email.id,
    metadata: {
      to: to.map((a) => a.email),
      subject: subject.slice(0, 120),
      sesMessageId: sent.sesMessageId,
    },
  });

  return NextResponse.json({ emailId: email.id, messageId: sent.messageId });
}
