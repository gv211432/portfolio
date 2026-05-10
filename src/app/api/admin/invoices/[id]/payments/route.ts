import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

type Params = { params: Promise<{ id: string }> };

function resolveStatus(paidAmount: number, total: number) {
  if (paidAmount <= 0) return null; // no change
  if (paidAmount >= total) return "PAID" as const;
  return "PARTLY_PAID" as const;
}

/** GET — list payments for this invoice */
export async function GET(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.view");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId: id },
    orderBy: { paidDate: "desc" },
  });
  return NextResponse.json({ payments });
}

/** POST — record a new payment */
export async function POST(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.edit");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const body = await req.json();
  const { amount, paidDate, notes } = body as { amount: number; paidDate: string; notes?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
  }
  if (!paidDate) {
    return NextResponse.json({ error: "paidDate is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "VOID") {
    return NextResponse.json({ error: "Cannot record payment on a voided invoice" }, { status: 400 });
  }

  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: id,
      amount,
      paidDate: new Date(paidDate),
      notes: notes?.trim() || null,
    },
  });

  // Recalculate total paid and update invoice status + paidAmount
  const agg = await prisma.invoicePayment.aggregate({
    where: { invoiceId: id },
    _sum: { amount: true },
  });
  const totalPaid = Number(agg._sum.amount ?? 0);
  const newStatus = resolveStatus(totalPaid, Number(invoice.total));

  await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: totalPaid,
      ...(newStatus ? { status: newStatus } : {}),
    },
  });

  return NextResponse.json({ payment });
}

/** DELETE — remove a payment (by paymentId in body) */
export async function DELETE(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.edit");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const { paymentId } = await req.json() as { paymentId: string };

  await prisma.invoicePayment.delete({ where: { id: paymentId, invoiceId: id } });

  // Recalculate
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ ok: true });

  const agg = await prisma.invoicePayment.aggregate({
    where: { invoiceId: id },
    _sum: { amount: true },
  });
  const totalPaid = Number(agg._sum.amount ?? 0);

  let newStatus: string = invoice.status;
  if (totalPaid <= 0) {
    // Revert to SENT if it was PAID/PARTLY_PAID
    if (invoice.status === "PAID" || invoice.status === "PARTLY_PAID") {
      newStatus = "SENT";
    }
  } else if (totalPaid < Number(invoice.total)) {
    newStatus = "PARTLY_PAID";
  } else {
    newStatus = "PAID";
  }

  await prisma.invoice.update({
    where: { id },
    data: { paidAmount: totalPaid, status: newStatus as never },
  });

  return NextResponse.json({ ok: true });
}
