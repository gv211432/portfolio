/**
 * System-initiated transactional emails for the mail platform:
 *   - onboarding credentials (sent to staff's recoveryEmail)
 *   - email-OTP challenges (2FA setup + login)
 *
 * Uses SES directly (SendEmailCommand) and logs via NotificationLog.
 * Reuses the dark theme tokens from the portfolio email wrapper.
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import prisma from "@/lib/prisma";
import { MAIL_ENV } from "./env";

const LOGO_ICON = "https://www.gaurav.one/img/logo/gaurav-dot-one-white.webp";

let _client: SESClient | null = null;
function ses() {
  if (_client) return _client;
  _client = new SESClient({
    region: MAIL_ENV.AWS_REGION,
    credentials: { accessKeyId: MAIL_ENV.AWS_KEY, secretAccessKey: MAIL_ENV.AWS_SECRET },
  });
  return _client;
}

function wrap(body: string, preheader = ""): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>email.${MAIL_ENV.DOMAIN}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 32px;">
    <img src="${LOGO_ICON}" alt="Mail" width="36" height="36" style="display:block;border-radius:6px;"/>
  </td></tr>
  <tr><td style="padding:32px;">${body}</td></tr>
  <tr><td style="border-top:1px solid #f0f0f0;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Automated message from <strong>${MAIL_ENV.DOMAIN}</strong>.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

interface SystemSendArgs {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  refType?: string;
  refId?: string;
}

async function sendSystem(a: SystemSendArgs): Promise<void> {
  let error: string | null = null;
  try {
    await ses().send(new SendEmailCommand({
      Source: `Mail Platform <${MAIL_ENV.SYSTEM_FROM}>`,
      Destination: { ToAddresses: [a.to] },
      Message: {
        Subject: { Data: a.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: a.html, Charset: "UTF-8" },
          Text: { Data: a.text, Charset: "UTF-8" },
        },
      },
    }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("[systemMail] failed:", error);
  }

  await prisma.notificationLog.create({
    data: {
      channel: "EMAIL",
      status: error ? "FAILED" : "SENT",
      subject: a.subject,
      body: a.text,
      toEmail: a.to,
      toName: a.toName ?? null,
      fromEmail: MAIL_ENV.SYSTEM_FROM,
      refType: a.refType ?? null,
      refId: a.refId ?? null,
      error,
    },
  }).catch(console.error);
}

/** Onboarding: send staff their email + temporary password to their recovery email. */
export async function sendStaffCredentials(args: {
  recoveryEmail: string;
  staffName: string;
  staffEmail: string;
  tempPassword: string;
  staffId: string;
}): Promise<void> {
  const loginUrl = `${MAIL_ENV.APP_ORIGIN}/mail/login`;
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Welcome, ${args.staffName} 👋</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      An email account has been created for you. Use the credentials below to sign in —
      you'll be asked to change your password and set up two-factor authentication on first login.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;">
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Email</td></tr>
      <tr><td style="font-size:16px;color:#111827;font-weight:600;padding-bottom:16px;">${args.staffEmail}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Temporary password</td></tr>
      <tr><td style="font-size:16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;display:inline-block;">${args.tempPassword}</td></tr>
    </table>
    <p style="margin:24px 0 0;">
      <a href="${loginUrl}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block;">Sign in</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      If you didn't expect this email, please contact your administrator.
    </p>
  `, `Your ${MAIL_ENV.DOMAIN} credentials`);

  const text = `Welcome, ${args.staffName}

Your email account is ready.

Email:    ${args.staffEmail}
Password: ${args.tempPassword}

Sign in: ${loginUrl}

You'll be asked to change your password and set up 2FA on first login.`;

  await sendSystem({
    to: args.recoveryEmail,
    toName: args.staffName,
    subject: `Your ${MAIL_ENV.DOMAIN} account is ready`,
    html, text,
    refType: "staff_onboarding",
    refId: args.staffId,
  });
}

/** Email-OTP challenge (2FA setup verification OR login 2FA). */
export async function sendOtpCode(args: {
  to: string;
  toName?: string;
  code: string;
  purpose: "setup" | "login";
  staffId: string;
}): Promise<void> {
  const title = args.purpose === "setup" ? "Verify your email for 2FA" : "Your sign-in code";
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${title}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      ${args.purpose === "setup"
        ? "Enter this code to finish enabling email-based two-factor authentication."
        : "Enter this code to complete sign-in."}
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:24px;text-align:center;margin:20px 0;">
      <div style="font-size:36px;letter-spacing:8px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#111827;">${args.code}</div>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;">Code expires in 10 minutes. If you didn't request this, you can safely ignore this message.</p>
  `, args.code);

  const text = `${title}\n\nCode: ${args.code}\n\nExpires in 10 minutes.`;

  await sendSystem({
    to: args.to,
    toName: args.toName,
    subject: args.purpose === "setup" ? "Verify your email for 2FA" : `Your code: ${args.code}`,
    html, text,
    refType: `staff_otp_${args.purpose}`,
    refId: args.staffId,
  });
}
