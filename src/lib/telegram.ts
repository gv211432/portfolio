/**
 * Telegram notification service.
 * Credentials are read from environment variables — never hardcoded.
 *
 * Every send attempt (success or failure) is persisted to NotificationLog.
 */

import prisma from "@/lib/prisma";

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramOptions {
  refType?: string;
  refId?: string;
}

export async function sendTelegramNotification(
  message: string,
  opts: TelegramOptions = {}
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // First line of the message as subject (strip HTML tags)
  const subject = message
    .split("\n")
    .find((l) => l.trim())
    ?.replace(/<[^>]+>/g, "")
    .trim()
    .slice(0, 255) ?? "Telegram notification";

  if (!token || !chatId) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification");
    await prisma.notificationLog.create({
      data: {
        channel: "TELEGRAM",
        status: "FAILED",
        subject,
        body: message,
        refType: opts.refType ?? null,
        refId: opts.refId ?? null,
        error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured",
      },
    }).catch(console.error);
    return;
  }

  let errorMsg: string | null = null;

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const body = await res.text();
      errorMsg = `HTTP ${res.status}: ${body}`;
      console.error("[Telegram] sendMessage failed:", body);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Telegram] Network error:", err);
  }

  await prisma.notificationLog.create({
    data: {
      channel: "TELEGRAM",
      status: errorMsg ? "FAILED" : "SENT",
      subject,
      body: message,
      refType: opts.refType ?? null,
      refId: opts.refId ?? null,
      error: errorMsg,
    },
  }).catch(console.error);
}
