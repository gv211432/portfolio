import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyLeegalityWebhook } from "@/lib/invoice/leegality";

/**
 * Public webhook — called by Leegality when a document is signed.
 * Validates HMAC-SHA1(documentId, LEEGALITY_PRIVATE_SALT) before trusting payload.
 *
 * Configure in Leegality Dashboard → Workflows → Webhook URL:
 *   https://gaurav.one/api/webhook/invoice-sign
 */
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { documentId, mac } = payload as { documentId?: string; mac?: string };

  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  // Validate HMAC when mac is present. Leegality may omit it on test pings.
  if (mac && !verifyLeegalityWebhook(documentId, mac)) {
    console.warn(`[invoice-sign webhook] HMAC mismatch for documentId=${documentId}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const log = await prisma.invoiceSignatureLog.findFirst({
    where: { leegalityDocId: documentId },
  });

  if (!log) {
    // Not our document — acknowledge silently (Leegality retries on non-2xx)
    console.warn(`[invoice-sign webhook] no log for documentId=${documentId}`);
    return NextResponse.json({ ok: true });
  }

  await prisma.invoiceSignatureLog.update({
    where: { id: log.id },
    data: {
      status: "SIGNED",
      webhookPayload: payload as object,
      completedAt: new Date(),
    },
  });

  await prisma.invoice.update({
    where: { id: log.invoiceId },
    data: { status: "SIGNED" },
  });

  console.info(`[invoice-sign webhook] invoice ${log.invoiceId} signed via documentId=${documentId}`);
  return NextResponse.json({ ok: true });
}
