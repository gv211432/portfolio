import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/admin/permissions";
import { generateInvoicePdf } from "@/lib/invoice/pdf";
import type { PdfInvoiceData } from "@/lib/invoice/pdf";

export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "invoice.pdf.generate");
  if (!perm.ok) return perm.response;

  const body = await req.json() as PdfInvoiceData;

  const buffer = await generateInvoicePdf(body);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
