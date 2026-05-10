import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin/permissions";
import { getFiscalYear } from "@/lib/invoice/sequence";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "invoice.next_number");
  if (!perm.ok) return perm.response;

  const fy = getFiscalYear();
  const seq = await prisma.invoiceSequence.findUnique({ where: { fiscalYear: fy } });
  const next = (seq?.lastSeq ?? 0) + 1;
  const preview = `INV-${fy}-${String(next).padStart(3, "0")}`;

  return NextResponse.json({ invoiceNumber: preview, fiscalYear: fy });
}
