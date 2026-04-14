/**
 * AWS Lambda: SES inbound → Postgres webhook bridge.
 *
 * Trigger: SES receipt rule → S3 action puts raw .eml at
 *          s3://$BUCKET/$INBOUND_PREFIX/<messageId>; S3:ObjectCreated event
 *          invokes this function.
 *
 * Flow:
 *   1. Read the raw .eml from S3.
 *   2. Parse with mailparser.
 *   3. Extract + upload each attachment into
 *      s3://$BUCKET/$ATTACHMENT_PREFIX/<messageId>/<n>-<filename>
 *   4. POST structured JSON to $WEBHOOK_URL with header x-api-key: $WEBHOOK_API_KEY.
 *      On 2xx: succeed. On 5xx / network: throw → Lambda retries (SQS DLQ
 *      recommended for poison messages).
 *
 * Environment variables:
 *   WEBHOOK_URL          e.g. https://gaurav.one/api/mail/inbound
 *   WEBHOOK_API_KEY      shared secret (matches MAIL_WEBHOOK_API_KEY)
 *   BUCKET               e.g. gaurav-mail
 *   INBOUND_PREFIX       default "inbound/"
 *   ATTACHMENT_PREFIX    default "attachments/"
 *
 * Package:
 *   bun add mailparser @aws-sdk/client-s3
 *   zip -r fn.zip index.mjs node_modules package.json
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET;
const ATTACHMENT_PREFIX = (process.env.ATTACHMENT_PREFIX ?? "attachments/").replace(/^\/+|\/+$/g, "") + "/";
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

function addrList(addr) {
  if (!addr) return [];
  const arr = Array.isArray(addr) ? addr : [addr];
  return arr.flatMap((a) => (a.value ?? []).map((v) => ({
    email: (v.address ?? "").toLowerCase().trim(),
    name: v.name || undefined,
  }))).filter((a) => a.email);
}

function safeName(n) {
  return (n || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function handler(event) {
  // S3 notification event: process each record.
  const records = event.Records ?? [];
  for (const r of records) {
    if (r.eventSource !== "aws:s3") continue;
    const srcKey = decodeURIComponent(r.s3.object.key.replace(/\+/g, " "));
    const srcBucket = r.s3.bucket.name;

    console.log(`[inbound] ${srcBucket}/${srcKey}`);

    const obj = await s3.send(new GetObjectCommand({ Bucket: srcBucket, Key: srcKey }));
    const raw = await streamToBuffer(obj.Body);
    const parsed = await simpleParser(raw);

    const messageId = (parsed.messageId ?? "").replace(/[<>]/g, "").trim()
      || `${Date.now()}.${srcKey.split("/").pop()}`;

    // Upload attachments (skip inline images with no filename/cid only).
    const attachments = [];
    let idx = 0;
    for (const att of parsed.attachments ?? []) {
      idx += 1;
      const filename = safeName(att.filename ?? `att-${idx}`);
      const key = `${ATTACHMENT_PREFIX}${messageId}/${idx}-${filename}`;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: att.content,
        ContentType: att.contentType ?? "application/octet-stream",
      }));
      attachments.push({
        filename,
        contentType: att.contentType ?? "application/octet-stream",
        sizeBytes: att.size ?? att.content?.length ?? 0,
        s3Key: key,
        contentId: att.cid ?? undefined,
      });
    }

    const payload = {
      messageId,
      s3Key: srcKey,
      sizeBytes: raw.length,
      date: (parsed.date ?? new Date()).toISOString(),
      from: addrList(parsed.from)[0],
      to: addrList(parsed.to),
      cc: addrList(parsed.cc),
      bcc: addrList(parsed.bcc),
      subject: parsed.subject ?? undefined,
      text: parsed.text ?? undefined,
      html: parsed.html || undefined,
      snippet: (parsed.text ?? "").trim().replace(/\s+/g, " ").slice(0, 240),
      inReplyTo: (parsed.inReplyTo ?? "").replace(/[<>]/g, "").trim() || undefined,
      references: Array.isArray(parsed.references)
        ? parsed.references.map((x) => x.replace(/[<>]/g, "").trim()).filter(Boolean)
        : parsed.references
          ? [parsed.references.replace(/[<>]/g, "").trim()]
          : undefined,
      attachments,
    };

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": WEBHOOK_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // 4xx: don't retry (bad payload / auth); 5xx: throw to retry.
      if (res.status >= 500) {
        throw new Error(`Webhook 5xx (${res.status}): ${body.slice(0, 300)}`);
      }
      console.error(`[inbound] webhook ${res.status}: ${body.slice(0, 300)}`);
    } else {
      console.log(`[inbound] delivered ${messageId}`);
    }
  }
  return { ok: true };
}
