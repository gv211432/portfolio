import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { nextInvoiceNumber } from "@/lib/invoice/sequence";
import { Decimal } from "@prisma/client/runtime/library";

function safeDecimal(v: unknown): Decimal {
  return new Decimal(String(v ?? 0));
}

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "invoice.list");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status") ?? undefined;
  const currency = searchParams.get("currency") ?? undefined;
  const clientId = searchParams.get("clientId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (currency) where.currency = currency;
  if (clientId) where.clientId = clientId;
  if (from || to) {
    where.invoiceDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
      { clientEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        clientName: true,
        clientEmail: true,
        invoiceDate: true,
        dueDate: true,
        currency: true,
        total: true,
        pdfS3Key: true,
        pdfGeneratedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
}

export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "invoice.create");
  if (!perm.ok) return perm.response;

  const body = await req.json();
  const {
    clientId, clientName, clientAddress, clientEmail,
    invoiceDate, dueDate, paymentTerms = "Net 15", currency = "USD",
    items = [], adjustment = 0,
    gstEnabled = false, gstRate = null,
    paymentProfileId, notes,
  } = body;

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }
  if (!invoiceDate || !dueDate) {
    return NextResponse.json({ error: "Invoice date and due date are required" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
  }

  const subtotal = items.reduce((sum: number, item: { hours: number; rate: number }) => {
    return sum + item.hours * item.rate;
  }, 0);

  const gstAmount = gstEnabled && gstRate ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + Number(adjustment) + gstAmount;

  const invoiceNumber = await nextInvoiceNumber(new Date(invoiceDate));

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId: clientId || null,
      clientName: clientName.trim(),
      clientAddress: clientAddress?.trim() || null,
      clientEmail: clientEmail?.trim() || null,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      paymentTerms,
      currency,
      subtotal: safeDecimal(subtotal),
      adjustment: safeDecimal(adjustment),
      gstEnabled,
      gstRate: gstEnabled && gstRate ? safeDecimal(gstRate) : null,
      gstAmount: gstEnabled ? safeDecimal(gstAmount) : null,
      total: safeDecimal(total),
      paymentProfileId: paymentProfileId || null,
      notes: notes?.trim() || null,
      items: {
        create: items.map((item: { dateLabel?: string; description: string; hours: number; rate: number }, idx: number) => ({
          dateLabel: item.dateLabel ?? "",
          description: item.description,
          hours: safeDecimal(item.hours),
          rate: safeDecimal(item.rate),
          amount: safeDecimal(item.hours * item.rate),
          sortOrder: idx,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
