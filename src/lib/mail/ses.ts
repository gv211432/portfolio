/**
 * SES sender for the mail platform.
 *
 * Uses SendRawEmailCommand so we can fully control headers (Message-ID,
 * In-Reply-To, References) required for threading, and support attachments.
 *
 * Every send is recorded in ActivityLog by the caller, not here, so this
 * module stays transport-only.
 */

import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "node:crypto";
import { MAIL_ENV } from "./env";

let _client: SESClient | null = null;
function ses(): SESClient {
  if (_client) return _client;
  _client = new SESClient({
    region: MAIL_ENV.AWS_REGION,
    credentials: {
      accessKeyId: MAIL_ENV.AWS_KEY,
      secretAccessKey: MAIL_ENV.AWS_SECRET,
    },
  });
  return _client;
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface SesAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  contentId?: string; // for inline
}

export interface SendParams {
  from: MailAddress;
  to: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;  // Message-ID being replied to
  references?: string[]; // ordered Message-IDs of the thread
  attachments?: SesAttachment[];
  /** Override the auto-generated Message-ID. */
  messageId?: string;
}

export interface SendResult {
  messageId: string;      // Message-ID header we set (used for DB idempotency)
  sesMessageId?: string;  // SES's own ID
}

function fmtAddress(a: MailAddress): string {
  return a.name ? `"${a.name.replace(/"/g, "'")}" <${a.email}>` : a.email;
}

function fmtAddressList(list: MailAddress[]): string {
  return list.map(fmtAddress).join(", ");
}

/**
 * Build a MIME message. Keeps implementation dependency-free.
 */
function buildMime(p: SendParams, messageId: string): string {
  const boundary = `----=_Part_${randomUUID()}`;
  const altBoundary = `----=_Alt_${randomUUID()}`;
  const hasAttach = !!(p.attachments && p.attachments.length);
  const hasHtml = !!p.bodyHtml;

  const headers: string[] = [
    `From: ${fmtAddress(p.from)}`,
    `To: ${fmtAddressList(p.to)}`,
  ];
  if (p.cc?.length) headers.push(`Cc: ${fmtAddressList(p.cc)}`);
  headers.push(`Subject: ${encodeMimeHeader(p.subject)}`);
  headers.push(`Message-ID: <${messageId}>`);
  headers.push(`Date: ${new Date().toUTCString()}`);
  headers.push("MIME-Version: 1.0");
  if (p.inReplyTo) headers.push(`In-Reply-To: <${p.inReplyTo}>`);
  if (p.references?.length) {
    headers.push(`References: ${p.references.map((r) => `<${r}>`).join(" ")}`);
  }

  if (hasAttach) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  } else if (hasHtml) {
    headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
  } else {
    headers.push(`Content-Type: text/plain; charset="UTF-8"`);
    headers.push(`Content-Transfer-Encoding: 8bit`);
    return headers.join("\r\n") + "\r\n\r\n" + p.bodyText;
  }

  const parts: string[] = [headers.join("\r\n"), ""];

  // Body section
  const bodySection = (): string => {
    if (hasHtml) {
      return [
        `--${altBoundary}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `Content-Transfer-Encoding: 8bit`,
        "",
        p.bodyText,
        "",
        `--${altBoundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: 8bit`,
        "",
        p.bodyHtml!,
        "",
        `--${altBoundary}--`,
      ].join("\r\n");
    }
    return [
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      "",
      p.bodyText,
    ].join("\r\n");
  };

  if (hasAttach) {
    parts.push(`--${boundary}`);
    if (hasHtml) {
      parts.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
      parts.push("");
      parts.push(bodySection());
    } else {
      parts.push(bodySection());
    }
    for (const att of p.attachments!) {
      parts.push("");
      parts.push(`--${boundary}`);
      parts.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
      parts.push(`Content-Transfer-Encoding: base64`);
      parts.push(
        att.contentId
          ? `Content-Disposition: inline; filename="${att.filename}"`
          : `Content-Disposition: attachment; filename="${att.filename}"`,
      );
      if (att.contentId) parts.push(`Content-ID: <${att.contentId}>`);
      parts.push("");
      parts.push(att.content.toString("base64").replace(/(.{76})/g, "$1\r\n"));
    }
    parts.push(`--${boundary}--`);
  } else {
    parts.push(bodySection());
  }

  return parts.join("\r\n");
}

/** RFC 2047 encoded-word for non-ASCII subjects. */
function encodeMimeHeader(v: string): string {
  if (/^[\x20-\x7E]*$/.test(v)) return v;
  return `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=`;
}

export async function sendViaSes(p: SendParams): Promise<SendResult> {
  const messageId = p.messageId ?? `${randomUUID()}@${MAIL_ENV.DOMAIN}`;
  const raw = buildMime(p, messageId);

  const destinations = [
    ...p.to.map((a) => a.email),
    ...(p.cc?.map((a) => a.email) ?? []),
    ...(p.bcc?.map((a) => a.email) ?? []),
  ];

  const res = await ses().send(
    new SendRawEmailCommand({
      Source: p.from.email,
      Destinations: destinations,
      RawMessage: { Data: Buffer.from(raw, "utf8") },
      ConfigurationSetName: MAIL_ENV.CONFIG_SET || undefined,
    }),
  );

  return { messageId, sesMessageId: res.MessageId };
}
