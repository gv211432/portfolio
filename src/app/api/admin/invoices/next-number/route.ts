import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getFiscalYear } from "@/lib/invoice/sequence";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fy = getFiscalYear();
  const seq = await prisma.invoiceSequence.findUnique({ where: { fiscalYear: fy } });
  const next = (seq?.lastSeq ?? 0) + 1;
  const preview = `INV-${fy}-${String(next).padStart(3, "0")}`;

  return NextResponse.json({ invoiceNumber: preview, fiscalYear: fy });
}
