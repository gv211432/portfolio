/**
 * Email OTP service for admin accounts.
 *
 * Shared across all flows:
 *   "setup_email"      — first-login: verify new recovery email
 *   "forgot_password"  — public reset: prove identity before resetting password
 *   "change_password"  — in-session: confirm before changing password
 *   "change_email"     — in-session: verify new recovery email after change
 *
 * Security properties:
 *   - 6-digit numeric OTP, bcrypt-hashed at rest
 *   - 10-minute expiry
 *   - Max 5 failed attempts before lockout
 *   - Rate-limited: 1 OTP per 60 seconds per user
 *   - OTP cleared on first successful verify
 */

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export type OtpPurpose =
  | "setup_email"
  | "forgot_password"
  | "change_password"
  | "change_email";

export type OtpResult = "ok" | "expired" | "invalid" | "locked" | "max_attempts";

const OTP_TTL_MS      = 10 * 60 * 1000;  // 10 min
const OTP_RATE_MS     = 60 * 1000;        // 1 per minute
const OTP_MAX_TRIES   = 5;
const FROM            = process.env.AWS_SES_FROM_EMAIL ?? "noreply@gaurav.one";

// ── Generate & store ──────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.length > 3 ? local.slice(0, 2) : local[0] ?? "*";
  return `${visible}***@${domain}`;
}

/**
 * Send an email OTP for the given purpose.
 * Returns the masked email on success, or throws on rate-limit / SES error.
 */
export async function sendAdminOtp(
  adminId: string,
  email: string,
  purpose: OtpPurpose,
): Promise<{ maskedEmail: string }> {
  // Rate-limit: 1 OTP per minute
  const user = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { lastOtpSentAt: true },
  });
  if (
    user?.lastOtpSentAt &&
    Date.now() - user.lastOtpSentAt.getTime() < OTP_RATE_MS
  ) {
    const waitSec = Math.ceil((OTP_RATE_MS - (Date.now() - user.lastOtpSentAt.getTime())) / 1000);
    throw new Error(`Please wait ${waitSec}s before requesting another code.`);
  }

  const otp  = generateOtp();
  const hash = await bcrypt.hash(otp, 10);

  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      pendingEmailOtpHash:     hash,
      pendingEmailOtpExpires:  new Date(Date.now() + OTP_TTL_MS),
      pendingEmailOtpPurpose:  purpose,
      pendingEmailOtpAttempts: 0,
      lastOtpSentAt:           new Date(),
    },
  });

  await sendOtpEmail(email, otp, purpose);

  return { maskedEmail: maskEmail(email) };
}

/** Verify an OTP. Returns result and clears OTP on success. */
export async function verifyAdminOtp(
  adminId: string,
  otp: string,
  purpose: OtpPurpose,
): Promise<OtpResult> {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      pendingEmailOtpHash:     true,
      pendingEmailOtpExpires:  true,
      pendingEmailOtpPurpose:  true,
      pendingEmailOtpAttempts: true,
    },
  });

  if (!user?.pendingEmailOtpHash || !user.pendingEmailOtpExpires) return "expired";
  if (user.pendingEmailOtpPurpose !== purpose) return "expired";
  if (new Date() > user.pendingEmailOtpExpires) {
    await clearOtp(adminId);
    return "expired";
  }
  if ((user.pendingEmailOtpAttempts ?? 0) >= OTP_MAX_TRIES) return "locked";

  const valid = await bcrypt.compare(otp.trim(), user.pendingEmailOtpHash);
  if (!valid) {
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { pendingEmailOtpAttempts: { increment: 1 } },
    });
    const remaining = OTP_MAX_TRIES - (user.pendingEmailOtpAttempts + 1);
    if (remaining <= 0) return "locked";
    return "invalid";
  }

  await clearOtp(adminId);
  return "ok";
}

async function clearOtp(adminId: string) {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      pendingEmailOtpHash:     null,
      pendingEmailOtpExpires:  null,
      pendingEmailOtpPurpose:  null,
      pendingEmailOtpAttempts: 0,
    },
  });
}

// ── Email sending ─────────────────────────────────────────────────────────────

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  setup_email:     "Recovery Email Setup",
  forgot_password: "Password Reset",
  change_password: "Password Change Verification",
  change_email:    "Recovery Email Change",
};

async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose) {
  const label = PURPOSE_LABELS[purpose];
  const html  = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
  <tr><td style="background:linear-gradient(135deg,#3730a3 0%,#4f46e5 100%);padding:28px 32px;">
    <p style="margin:0;font-size:13px;color:#c7d2fe;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Gaurav.One Admin</p>
    <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:700;">${label}</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;">Your one-time verification code is:</p>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:800;color:#818cf8;letter-spacing:0.3em;font-family:monospace;">${otp}</span>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">This code expires in <strong style="color:#94a3b8;">10 minutes</strong> and can only be used once.</p>
    <p style="margin:0;font-size:13px;color:#64748b;">If you did not request this, your account credentials may be compromised. Contact your system administrator immediately.</p>
  </td></tr>
  <tr><td style="border-top:1px solid #334155;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#475569;">Automated security message from Gaurav.One admin system. Do not reply.</p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = `Gaurav.One Admin — ${label}\n\nYour verification code: ${otp}\n\nExpires in 10 minutes. Do not share this code.`;

  if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
    console.warn(`[AdminOtp] SES not configured — OTP for ${to}: ${otp}`);
    return;
  }

  const client = new SESClient({
    region: process.env.AWS_SES_REGION ?? "us-east-1",
    credentials: {
      accessKeyId:     process.env.AWS_SES_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(new SendEmailCommand({
    Source:      `Gaurav.One Admin <${FROM}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `[${otp}] ${label} — Gaurav.One Admin`, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
  }));
}
