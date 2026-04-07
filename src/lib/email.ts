/**
 * Email service — AWS SES via @aws-sdk/client-ses
 *
 * Required environment variables:
 *   AWS_SES_ACCESS_KEY_ID
 *   AWS_SES_SECRET_ACCESS_KEY
 *   AWS_SES_REGION
 *   AWS_SES_FROM_EMAIL
 *
 * Every send attempt (success or failure) is persisted to NotificationLog.
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import prisma from "@/lib/prisma";

const FROM = process.env.AWS_SES_FROM_EMAIL ?? "noreply@gaurav.one";

const LOGO_FULL  = "https://www.gaurav.one/img/logo/light-gaurav.one.webp";
const LOGO_ICON  = "https://www.gaurav.one/img/logo/gaurav-dot-one-white.webp";

function getClient(): SESClient {
  return new SESClient({
    region: process.env.AWS_SES_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
    },
  });
}

// ---------------------------------------------------------------------------
// Core sender — logs every attempt to NotificationLog
// ---------------------------------------------------------------------------

interface SendOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  refType?: string;
  refId?: string;
}

async function sendEmail(opts: SendOptions): Promise<void> {
  const { to, toName, subject, text, html, refType, refId } = opts;

  if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
    console.warn("[Email] AWS SES credentials not set — skipping email to", to);
    await prisma.notificationLog.create({
      data: {
        channel: "EMAIL",
        status: "FAILED",
        subject,
        body: text,
        toEmail: to,
        toName: toName ?? null,
        fromEmail: FROM,
        refType: refType ?? null,
        refId: refId ?? null,
        error: "AWS SES credentials not configured",
      },
    }).catch(console.error);
    return;
  }

  let errorMsg: string | null = null;

  try {
    const client = getClient();
    await client.send(
      new SendEmailCommand({
        Source: `Gaurav.One <${FROM}>`,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: html, Charset: "UTF-8" },
            Text: { Data: text, Charset: "UTF-8" },
          },
        },
      })
    );
    console.log("[Email] Sent to", to, "—", subject);
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Email] SES send failed:", err);
  }

  await prisma.notificationLog.create({
    data: {
      channel: "EMAIL",
      status: errorMsg ? "FAILED" : "SENT",
      subject,
      body: text,
      toEmail: to,
      toName: toName ?? null,
      fromEmail: FROM,
      refType: refType ?? null,
      refId: refId ?? null,
      error: errorMsg,
    },
  }).catch(console.error);
}

// ---------------------------------------------------------------------------
// Shared HTML layout wrapper
// ---------------------------------------------------------------------------

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gaurav.One</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                <img src="${LOGO_ICON}" alt="Gaurav.One" width="36" height="36"
                     style="display:block;border-radius:6px;" />
              </td>
              <td style="vertical-align:middle;">
                <img src="${LOGO_FULL}" alt="Gaurav.One" height="28"
                     style="display:block;max-height:28px;" />
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #f0f0f0;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:center;padding-bottom:12px;">
                <a href="https://gaurav.one/domains/whitelabel" style="color:#6366f1;text-decoration:none;font-size:12px;margin:0 8px;">White-label</a>
                <span style="color:#d1d5db;font-size:12px;">·</span>
                <a href="https://gaurav.one/domains/casestudy" style="color:#6366f1;text-decoration:none;font-size:12px;margin:0 8px;">Case Studies</a>
                <span style="color:#d1d5db;font-size:12px;">·</span>
                <a href="https://gaurav.one/blog" style="color:#6366f1;text-decoration:none;font-size:12px;margin:0 8px;">Blog</a>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;">
                <p style="margin:0;font-size:11px;color:#9ca3af;">
                  This is an automated message from
                  <a href="https://gaurav.one" style="color:#6366f1;text-decoration:none;">gaurav.one</a>.
                  Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1. Job Application acknowledgment
// ---------------------------------------------------------------------------

export async function sendJobApplicationAck(params: {
  to: string;
  name: string;
  jobTitle: string;
  applicationId: string;
}): Promise<void> {
  const { to, name, jobTitle, applicationId } = params;

  const subject = `Application Received — ${jobTitle}`;

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      Application Received ✅
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Reference: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${applicationId}</code></p>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Thank you for applying for the <strong>${jobTitle}</strong> position. We've successfully received your application and our team will review it shortly.
    </p>

    <div style="background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
        <strong>What happens next?</strong><br/>
        We typically review applications within <strong>5–7 business days</strong>. If your profile is a strong match, our team will reach out to you at this email address to schedule the next steps.
      </p>
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      In the meantime, feel free to explore our
      <a href="https://gaurav.one/domains/whitelabel" style="color:#6366f1;text-decoration:none;">white-label solutions</a>,
      <a href="https://gaurav.one/domains/casestudy" style="color:#6366f1;text-decoration:none;">case studies</a>,
      or the latest on our
      <a href="https://gaurav.one/blog" style="color:#6366f1;text-decoration:none;">blog</a>.
    </p>
  `);

  const text = `Application Received — ${jobTitle}

Hi ${name},

Thank you for applying for the ${jobTitle} position. We've successfully received your application (ID: ${applicationId}).

We typically review applications within 5–7 business days. If your profile is a strong match, our team will reach out to you.

— Gaurav.One | gaurav.one`;

  await sendEmail({
    to,
    toName: name,
    subject,
    html,
    text,
    refType: "job_application",
    refId: applicationId,
  });
}

// ---------------------------------------------------------------------------
// 2. Contact / Enquiry acknowledgment
// ---------------------------------------------------------------------------

export async function sendEnquiryAck(params: {
  to: string;
  name: string;
  submissionId: string;
}): Promise<void> {
  const { to, name, submissionId } = params;

  const subject = "Enquiry Received — We'll be in touch soon!";

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      Enquiry Received ✅
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Reference: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${submissionId}</code></p>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Thanks for reaching out! We've received your enquiry and will get back to you as soon as possible — usually within <strong>24 hours</strong>.
    </p>

    <div style="background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
        While you wait, explore our
        <a href="https://gaurav.one/domains/whitelabel" style="color:#6366f1;text-decoration:none;">white-label solutions</a>,
        browse our
        <a href="https://gaurav.one/domains/casestudy" style="color:#6366f1;text-decoration:none;">case studies</a>,
        or read the latest on our
        <a href="https://gaurav.one/blog" style="color:#6366f1;text-decoration:none;">blog</a>.
      </p>
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Looking forward to the conversation!
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#374151;font-weight:600;">
      — Gaurav.One Team
    </p>
  `);

  const text = `Enquiry Received

Hi ${name},

Thanks for reaching out! We've received your enquiry (ID: ${submissionId}) and will get back to you within 24 hours.

In the meantime, explore our white-label solutions, case studies, and blog at gaurav.one.

— Gaurav.One Team | gaurav.one`;

  await sendEmail({
    to,
    toName: name,
    subject,
    html,
    text,
    refType: "enquiry",
    refId: submissionId,
  });
}

// ---------------------------------------------------------------------------
// 3. NGO Application acknowledgment
// ---------------------------------------------------------------------------

export async function sendNgoApplicationAck(params: {
  to: string;
  organizationName: string;
  subdomain: string;
  applicationId: string;
}): Promise<void> {
  const { to, organizationName, subdomain, applicationId } = params;

  const subject = `NGO Application Received — ${organizationName}`;

  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
      NGO Application Received ✅
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Reference: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${applicationId}</code></p>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${organizationName}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Thank you for applying to the <strong>myOrg.in</strong> free development program. We've received your application for
      <code style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:4px;font-size:13px;">${subdomain}.myorg.in</code>
      and our team will review it shortly.
    </p>

    <div style="background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">What happens next?</p>
      <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;line-height:1.8;">
        <tr><td style="padding-right:8px;vertical-align:top;color:#22c55e;">●</td><td><strong>3–5 business days</strong> — Application review by our team</td></tr>
        <tr><td style="padding-right:8px;vertical-align:top;color:#22c55e;">●</td><td><strong>1–2 days</strong> — Initial contact if approved</td></tr>
        <tr><td style="padding-right:8px;vertical-align:top;color:#22c55e;">●</td><td><strong>1 week</strong> — Timeline discussion &amp; requirements</td></tr>
        <tr><td style="padding-right:8px;vertical-align:top;color:#22c55e;">●</td><td><strong>2–6 weeks</strong> — Development begins</td></tr>
      </table>
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      We're excited about the possibility of supporting your mission. Learn more about how we work with NGOs on our
      <a href="https://gaurav.one/domains/casestudy" style="color:#6366f1;text-decoration:none;">case studies</a> page.
    </p>
  `);

  const text = `NGO Application Received — myOrg.in

Hi ${organizationName},

Thank you for applying to the myOrg.in free development program. We've received your application for ${subdomain}.myorg.in (ID: ${applicationId}).

What happens next:
• 3-5 business days — Application review
• 1-2 days — Initial contact if approved
• 1 week — Timeline discussion
• 2-6 weeks — Development begins

We'll reach out to you at this email address if your application is approved.

— myOrg.in | Powered by gaurav.one`;

  await sendEmail({
    to,
    toName: organizationName,
    subject,
    html,
    text,
    refType: "ngo_application",
    refId: applicationId,
  });
}
