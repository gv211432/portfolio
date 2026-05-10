/**
 * Welcome email — sent once when a staff member first reaches an ACTIVE session.
 * Explains the mailbox, login flow, and how to recover access.
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import prisma from "@/lib/prisma";
import { MAIL_ENV } from "./env";

function ses() {
  return new SESClient({
    region: MAIL_ENV.AWS_REGION,
    credentials: { accessKeyId: MAIL_ENV.AWS_KEY, secretAccessKey: MAIL_ENV.AWS_SECRET },
  });
}

function html(name: string, workEmail: string, domain: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px;">
    <img src="https://www.gaurav.one/img/logo/gaurav-dot-one-white.webp" alt="${domain}" width="40" height="40" style="display:block;border-radius:8px;margin-bottom:16px;"/>
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Welcome to your mailbox!</h1>
    <p style="margin:8px 0 0;font-size:15px;color:#c7d2fe;">You're all set at <strong>${domain}</strong></p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      Hi <strong>${name}</strong>, your account is now active. Here's everything you need to know.
    </p>

    <!-- Sign-in info -->
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:10px;padding:20px;margin:0 0 24px;">
      <tr><td style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:12px;">Sign-in details</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:2px;">Work email (username)</td></tr>
      <tr><td style="font-size:15px;font-weight:600;color:#111827;padding-bottom:12px;">${workEmail}</td></tr>
      <tr><td style="font-size:13px;color:#6b7280;padding-bottom:2px;">Mailbox URL</td></tr>
      <tr><td><a href="https://webmail.${domain}/mail" style="font-size:15px;font-weight:600;color:#4f46e5;text-decoration:none;">webmail.${domain}/mail</a></td></tr>
    </table>

    <!-- 2FA info -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Two-Factor Authentication</h2>
    <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.7;">
      Every login requires your password plus one of your 2FA methods:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
      <li><strong>Authenticator app (TOTP)</strong> — Google Authenticator, Authy, 1Password, etc.</li>
      <li><strong>Email OTP</strong> — a 6-digit code sent to your registered email</li>
    </ul>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
      You can manage both methods in <strong>Account Settings → Two-Factor</strong> inside the mailbox.
    </p>

    <!-- Recovery info -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">⚠ Password recovery requires both 2FA methods</p>
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">
        To self-reset your password (using "Forgot password?" on the login page), you must have <strong>both</strong>
        the authenticator app and email OTP enabled. If only one is set up, you'll need to contact your admin for a manual reset.
        <br/><br/>
        <strong>We strongly recommend enabling both methods</strong> in Account Settings → Two-Factor.
      </p>
    </div>

    <!-- Recovery codes -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Recovery codes</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
      After setting up TOTP, you'll be shown 8 one-time recovery codes. Save them somewhere safe (password manager, printed paper).
      Each code works <strong>once</strong> as a backup if you lose access to your authenticator app.
      You can regenerate them anytime in Account Settings → Two-Factor.
    </p>

    <!-- Features -->
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Quick features</h2>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:1.9;">
      <li>Compose, reply, and forward emails</li>
      <li>Organize with labels and folders (Inbox, Sent, Drafts, Archive, Trash)</li>
      <li>Search across all mail</li>
      <li>Starred messages for quick access</li>
      <li>Change your display name and appearance in Account Settings</li>
    </ul>

    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
      If you have any issues, contact your admin or use the "Contact support" link on the login page.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="border-top:1px solid #f0f0f0;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">This is a one-time welcome message from <strong>${domain}</strong>. You will not receive further automated emails unless you trigger them.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Send the welcome email once when staff first reaches ACTIVE.
 * Guards against duplicate sends via `welcomeEmailSent` flag.
 */
export async function sendWelcomeEmailIfFirst(staffId: string): Promise<void> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { emailAddress: true },
  });

  if (!staff || staff.welcomeEmailSent || !staff.recoveryEmail) return;

  // Mark first to prevent concurrent duplicate sends
  await prisma.staff.update({
    where: { id: staffId },
    data: { welcomeEmailSent: true },
  });

  const name      = staff.displayName || `${staff.firstName} ${staff.lastName}`;
  const workEmail = staff.emailAddress?.email ?? "";
  const domain    = MAIL_ENV.DOMAIN;

  const text = `Welcome to ${domain}!\n\nHi ${name},\n\nYour mailbox is now active.\n\nSign in: https://webmail.${domain}/mail\nWork email: ${workEmail}\n\nEvery login requires password + one 2FA method (TOTP or Email OTP).\n\nPassword recovery requires BOTH 2FA methods. Enable both in Account Settings → Two-Factor.\n\nIf you need help, contact your admin or use "Contact support" on the login page.\n\n— ${domain}`;

  try {
    await ses().send(new SendEmailCommand({
      Source:      `${domain} <${MAIL_ENV.SYSTEM_FROM}>`,
      Destination: { ToAddresses: [staff.recoveryEmail] },
      Message: {
        Subject: { Data: `Welcome to your ${domain} mailbox`, Charset: "UTF-8" },
        Body: {
          Html: { Data: html(name, workEmail, domain), Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    }));
    console.info(`[staffWelcome] sent to ${staff.recoveryEmail} (staff ${staffId})`);
  } catch (err) {
    // Non-fatal — log but don't fail the login flow
    console.error("[staffWelcome] SES send failed:", err);
    // Roll back the flag so it can be retried later
    await prisma.staff.update({ where: { id: staffId }, data: { welcomeEmailSent: false } }).catch(() => {});
  }
}
