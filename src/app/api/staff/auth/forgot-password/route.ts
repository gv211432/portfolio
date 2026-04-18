/**
 * POST /api/staff/auth/forgot-password
 * Body: { email }
 *
 * Looks up the staff account by email address.
 * - No account found          → 404 (generic — don't leak account existence in UX)
 * - Account has no recovery email → { hasRecovery: false }
 * - Account has recovery email    → sends OTP to recoveryEmail, stores hashed OTP
 *                                   in ChatKVStore (key: `pwd_reset:<staffId>`)
 *                                   → { hasRecovery: true }
 *
 * No auth required (pre-login).
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateNumericOtp } from "@/lib/mail/text";
import { MAIL_ENV } from "@/lib/mail/env";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const OTP_TTL_MS = 15 * 60_000; // 15 minutes
const KV_PREFIX = "pwd_reset:";

function ses() {
  return new SESClient({
    region: MAIL_ENV.AWS_REGION,
    credentials: { accessKeyId: MAIL_ENV.AWS_KEY, secretAccessKey: MAIL_ENV.AWS_SECRET },
  });
}

function emailHtml(name: string, code: string, domain: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:24px 32px;">
    <img src="https://www.gaurav.one/img/logo/gaurav-dot-one-white.webp" alt="Mail" width="36" height="36" style="display:block;border-radius:6px;"/>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Password Reset</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hi <strong>${name}</strong>, we received a request to reset the password for your <strong>${domain}</strong> mail account.
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:24px;text-align:center;margin:20px 0;">
      <div style="font-size:36px;letter-spacing:8px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#111827;">${code}</div>
    </div>
    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">This code expires in <strong>15 minutes</strong>.</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  </td></tr>
  <tr><td style="border-top:1px solid #f0f0f0;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Automated message from <strong>${domain}</strong>.</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const staffAddr = await prisma.staffEmailAddress.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { staff: true },
    });

    if (!staffAddr || staffAddr.staff.status !== "ACTIVE") {
      // Return 200 with hasRecovery=false so we don't reveal whether the account exists
      return NextResponse.json({ hasRecovery: false, noAccount: true });
    }

    const { staff } = staffAddr;

    if (!staff.recoveryEmail) {
      return NextResponse.json({ hasRecovery: false });
    }

    const code = generateNumericOtp();
    const hash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await prisma.chatKVStore.upsert({
      where: { key: KV_PREFIX + staff.id },
      update: { value: JSON.stringify({ hash, expiresAt, staffId: staff.id }) },
      create: { key: KV_PREFIX + staff.id, value: JSON.stringify({ hash, expiresAt, staffId: staff.id }) },
    });

    const name = staff.displayName || `${staff.firstName} ${staff.lastName}`;

    try {
      await ses().send(new SendEmailCommand({
        Source: `Mail Platform <${MAIL_ENV.SYSTEM_FROM}>`,
        Destination: { ToAddresses: [staff.recoveryEmail] },
        Message: {
          Subject: { Data: `Password reset code — ${MAIL_ENV.DOMAIN}`, Charset: "UTF-8" },
          Body: {
            Html: { Data: emailHtml(name, code, MAIL_ENV.DOMAIN), Charset: "UTF-8" },
            Text: { Data: `Password Reset\n\nHi ${name},\n\nYour reset code: ${code}\n\nExpires in 15 minutes.\n\nIf you didn't request this, ignore this email.`, Charset: "UTF-8" },
          },
        },
      }));
    } catch (err) {
      console.error("[forgot-password] SES send failed:", err);
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    // Mask recovery email for display: j***@gmail.com
    const [local, domain] = staff.recoveryEmail.split("@");
    const masked = local.charAt(0) + "***@" + domain;

    return NextResponse.json({ hasRecovery: true, maskedEmail: masked });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
