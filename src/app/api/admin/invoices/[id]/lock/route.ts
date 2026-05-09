import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

type Params = { params: Promise<{ id: string }> };

/** POST — toggle lock. Body: { lock: boolean } */
export async function POST(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { lock } = await req.json() as { lock: boolean };

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "SIGNED") {
    return NextResponse.json({ error: "Signed invoices cannot be unlocked" }, { status: 400 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { isLocked: lock },
  });

  return NextResponse.json({ invoice: updated });
}
