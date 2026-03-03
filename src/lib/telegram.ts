/**
 * Telegram notification service.
 * Credentials are read from environment variables — never hardcoded.
 */

const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramNotification(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification");
    return;
  }

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
      console.error("[Telegram] sendMessage failed:", body);
    }
  } catch (err) {
    console.error("[Telegram] Network error:", err);
  }
}
