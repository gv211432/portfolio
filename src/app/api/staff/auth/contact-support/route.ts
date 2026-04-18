/**
 * POST /api/staff/auth/contact-support
 * Body: { workEmail, contactEmail, message? }
 *
 * Sends an instant acknowledgement email to contactEmail and forwards
 * the ticket to the support address. Logs to NotificationLog.
 * No auth required (pre-login).
 */

import { NextRequest, NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import prisma from "@/lib/prisma";
import { MAIL_ENV } from "@/lib/mail/env";

function ses() {
  return new SESClient({
    region: MAIL_ENV.AWS_REGION,
    credentials: { accessKeyId: MAIL_ENV.AWS_KEY, secretAccessKey: MAIL_ENV.AWS_SECRET },
  });
}

function ackHtml(contactEmail: string, workEmail: string, domain: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 32px;">
    <img src="https://www.gaurav.one/img/logo/gaurav-dot-one-white.webp" alt="Mail" width="36" height="36" style="display:block;border-radius:6px;"/>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">We've received your request</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Thank you for reaching out to <strong>${domain}</strong> support. Your request has been logged and our team will be in touch shortly.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:8px;padding:20px;margin:16px 0;">
      <tr>
        <td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Work / account email</td>
      </tr>
      <tr>
        <td style="font-size:15px;color:#111827;font-weight:500;padding-bottom:14px;">${workEmail || "—"}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Contact email (replies will come here)</td>
      </tr>
      <tr>
        <td style="font-size:15px;color:#111827;font-weight:500;">${contactEmail}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
      Typical response time is within <strong>1 business day</strong>. Please reply to this email if you have any additional information to share.
    </p>
  </td></tr>
  <tr><td style="border-top:1px solid #f0f0f0;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Automated acknowledgement from <strong>${domain}</strong> support.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function ticketHtml(workEmail: string, contactEmail: string, message: string, domain: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#9f1239 100%);padding:16px 24px;">
    <p style="margin:0;color:#fff;font-size:13px;font-weight:600;">⚠ Support Ticket — ${domain}</p>
  </td></tr>
  <tr><td style="padding:24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:2px;">Work email</td></tr>
      <tr><td style="font-size:15px;color:#111827;font-weight:500;padding-bottom:12px;">${workEmail || "—"}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:2px;">Contact email</td></tr>
      <tr><td style="font-size:15px;color:#111827;font-weight:500;padding-bottom:12px;">${contactEmail}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:2px;">Message</td></tr>
      <tr><td style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${message || "(no message provided)"}</td></tr>
    </table>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workEmail = (body.workEmail ?? "").trim().toLowerCase();
    const contactEmail = (body.contactEmail ?? "").trim().toLowerCase();
    const message = (body.message ?? "").trim().slice(0, 2000);

    if (!isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "A valid contact email is required" }, { status: 400 });
    }

    const client = ses();
    const domain = MAIL_ENV.DOMAIN;
    const fromAddr = `Support <${MAIL_ENV.SYSTEM_FROM}>`;

    // 1. Acknowledgement to the user
    const ackResult = await client.send(new SendEmailCommand({
      Source: fromAddr,
      Destination: { ToAddresses: [contactEmail] },
      Message: {
        Subject: { Data: `Support request received — ${domain}`, Charset: "UTF-8" },
        Body: {
          Html: { Data: ackHtml(contactEmail, workEmail, domain), Charset: "UTF-8" },
          Text: {
            Data: `Hi,\n\nWe've received your support request for ${domain}.\n\nWork email: ${workEmail || "—"}\nContact email: ${contactEmail}\n\nOur team will reply to this email within 1 business day.\n\nRegards,\n${domain} Support`,
            Charset: "UTF-8",
          },
        },
      },
    })).catch((e) => { console.error("[contact-support] ack send failed:", e); return null; });

    // 2. Ticket forwarded to support (system from address)
    if (MAIL_ENV.SYSTEM_FROM !== contactEmail) {
      await client.send(new SendEmailCommand({
        Source: fromAddr,
        Destination: { ToAddresses: [MAIL_ENV.SYSTEM_FROM] },
        ReplyToAddresses: [contactEmail],
        Message: {
          Subject: { Data: `[Support] Access request from ${workEmail || contactEmail}`, Charset: "UTF-8" },
          Body: {
            Html: { Data: ticketHtml(workEmail, contactEmail, message, domain), Charset: "UTF-8" },
            Text: {
              Data: `Support ticket\n\nWork email: ${workEmail || "—"}\nContact: ${contactEmail}\n\nMessage:\n${message || "(none)"}`,
              Charset: "UTF-8",
            },
          },
        },
      })).catch((e) => console.error("[contact-support] ticket send failed:", e));
    }

    // 3. Log to NotificationLog
    await prisma.notificationLog.create({
      data: {
        channel: "EMAIL",
        status: ackResult ? "SENT" : "FAILED",
        subject: `Support request received — ${domain}`,
        body: `workEmail: ${workEmail}\ncontactEmail: ${contactEmail}\nmessage: ${message}`,
        toEmail: contactEmail,
        fromEmail: MAIL_ENV.SYSTEM_FROM,
        refType: "support_request",
        error: ackResult ? null : "SES send failed",
      },
    }).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact-support]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
