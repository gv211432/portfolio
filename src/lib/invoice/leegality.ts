import { createHmac } from "node:crypto";
import { INVOICE_ENV } from "./env";

export interface LeegalitySignResponse {
  documentId: string;
  signingUrl?: string;
  signUrl?: string; // some API versions use this alias
  status?: string;
}

export interface InitiateSignResult {
  documentId: string;
  signingUrl: string | null;
}

/**
 * Upload a PDF to Leegality and request a signing workflow.
 * Returns the documentId and the signingUrl the signer opens.
 */
export async function initiateLeegalitySign(opts: {
  invoiceNumber: string;
  signerName: string;
  signerEmail?: string | null;
  pdfBuffer: Buffer;
}): Promise<InitiateSignResult> {
  const { invoiceNumber, signerName, signerEmail, pdfBuffer } = opts;

  const body = {
    profileId: INVOICE_ENV.LEEGALITY_PROFILE_ID,
    file: {
      name: `invoice-${invoiceNumber}.pdf`,
      file: pdfBuffer.toString("base64"),
    },
    invitees: [
      {
        name: signerName,
        ...(signerEmail ? { email: signerEmail } : {}),
      },
    ],
    irn: invoiceNumber,
  };

  const res = await fetch(`${INVOICE_ENV.LEEGALITY_API_BASE}/v3.0/sign/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": INVOICE_ENV.LEEGALITY_TOKEN,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Leegality API error ${res.status}: ${text}`);
  }

  const data: LeegalitySignResponse = await res.json();
  const signingUrl = data.signingUrl ?? data.signUrl ?? null;

  return { documentId: data.documentId, signingUrl };
}

/**
 * Verify the HMAC-SHA1 mac sent by Leegality webhooks.
 * HMAC-SHA1(documentId, LEEGALITY_PRIVATE_SALT)
 */
export function verifyLeegalityWebhook(documentId: string, mac: string): boolean {
  const expected = createHmac("sha1", INVOICE_ENV.LEEGALITY_PRIVATE_SALT)
    .update(documentId)
    .digest("hex");
  return expected === mac;
}
