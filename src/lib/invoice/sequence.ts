import { prisma } from "@/lib/prisma";

/** Returns fiscal year string for a given date. India FY: Apr 1 → Mar 31.
 *  e.g.  2026-06-01 → "26-27",  2026-01-15 → "25-26" */
export function getFiscalYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-based
  const fyStart = month >= 4 ? year : year - 1;
  return `${String(fyStart).slice(-2)}-${String(fyStart + 1).slice(-2)}`;
}

/** Atomically increments the sequence for a fiscal year and returns the next number.
 *  Uses a DB-level increment to be safe under concurrent requests. */
export async function nextInvoiceNumber(date?: Date): Promise<string> {
  const fy = getFiscalYear(date);

  const updated = await prisma.invoiceSequence.upsert({
    where: { fiscalYear: fy },
    create: { fiscalYear: fy, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seq = String(updated.lastSeq).padStart(3, "0");
  return `INV-${fy}-${seq}`;
}
