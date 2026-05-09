import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { deletePdf } from "@/lib/invoice/s3";
import { Decimal } from "@prisma/client/runtime/library";

type Params = { params: Promise<{ id: string }> };

function safeDecimal(v: unknown): Decimal {
  return new Decimal(String(v ?? 0));
}

export async function GET(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      emailLogs: { orderBy: { createdAt: "desc" } },
      signatureLog: true,
      paymentProfile: { select: { id: true, label: true, currency: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === "SIGNED") {
    return NextResponse.json({ error: "Signed invoices cannot be edited" }, { status: 400 });
  }

  const body = await req.json();
  const {
    clientId, clientName, clientAddress, clientEmail,
    invoiceDate, dueDate, paymentTerms, currency,
    items, adjustment, gstEnabled, gstRate,
    paymentProfileId, notes, status,
  } = body;

  // Allowed status transitions (manual)
  if (status !== undefined) {
    const allowed = ["VOID"];
    if (existing.status === "FINALIZED") allowed.push("DRAFT"); // allow re-opening
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot manually set status to ${status}` }, { status: 400 });
    }
  }

  let computedSubtotal = Number(existing.subtotal);
  let computedGstAmount = existing.gstAmount ? Number(existing.gstAmount) : 0;
  let computedTotal = Number(existing.total);
  const effectiveAdjustment = adjustment !== undefined ? Number(adjustment) : Number(existing.adjustment);
  const effectiveGstEnabled = gstEnabled !== undefined ? gstEnabled : existing.gstEnabled;
  const effectiveGstRate = gstRate !== undefined ? gstRate : (existing.gstRate ? Number(existing.gstRate) : null);

  // Rebuild items if provided
  let itemOps = {};
  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }
    computedSubtotal = items.reduce((s: number, i: { hours: number; rate: number }) => s + i.hours * i.rate, 0);
    computedGstAmount = effectiveGstEnabled && effectiveGstRate ? (computedSubtotal * effectiveGstRate) / 100 : 0;
    computedTotal = computedSubtotal + effectiveAdjustment + computedGstAmount;
    itemOps = {
      items: {
        deleteMany: {},
        create: items.map((item: { dateLabel?: string; description: string; hours: number; rate: number }, idx: number) => ({
          dateLabel: item.dateLabel ?? "",
          description: item.description,
          hours: safeDecimal(item.hours),
          rate: safeDecimal(item.rate),
          amount: safeDecimal(item.hours * item.rate),
          sortOrder: idx,
        })),
      },
    };
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(clientId !== undefined && { clientId: clientId || null }),
      ...(clientName !== undefined && { clientName: clientName.trim() }),
      ...(clientAddress !== undefined && { clientAddress: clientAddress?.trim() || null }),
      ...(clientEmail !== undefined && { clientEmail: clientEmail?.trim() || null }),
      ...(invoiceDate !== undefined && { invoiceDate: new Date(invoiceDate) }),
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      ...(paymentTerms !== undefined && { paymentTerms }),
      ...(currency !== undefined && { currency }),
      ...(adjustment !== undefined && { adjustment: safeDecimal(adjustment) }),
      ...(gstEnabled !== undefined && { gstEnabled }),
      ...(gstRate !== undefined && { gstRate: gstEnabled && gstRate ? safeDecimal(gstRate) : null }),
      ...(items !== undefined && {
        subtotal: safeDecimal(computedSubtotal),
        gstAmount: effectiveGstEnabled ? safeDecimal(computedGstAmount) : null,
        total: safeDecimal(computedTotal),
      }),
      ...(paymentProfileId !== undefined && { paymentProfileId: paymentProfileId || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(status !== undefined && { status }),
      ...itemOps,
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      emailLogs: { orderBy: { createdAt: "desc" } },
      signatureLog: true,
    },
  });

  return NextResponse.json({ invoice });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT invoices can be deleted" }, { status: 400 });
  }

  // Delete PDF from S3 if present
  if (existing.pdfS3Key) {
    try { await deletePdf(id); } catch { /* ignore S3 errors on delete */ }
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
