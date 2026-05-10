import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "invoice.view");
  if (!perm.ok) return perm.response;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const currency = searchParams.get("currency") ?? "USD";

  // All invoices for that currency
  const invoices = await prisma.invoice.findMany({
    where: { currency, status: { not: "VOID" } },
    select: {
      id: true,
      invoiceDate: true,
      total: true,
      paidAmount: true,
      status: true,
    },
  });

  // Payments for trend (actual payment dates)
  const payments = await prisma.invoicePayment.findMany({
    where: { invoice: { currency } },
    select: { amount: true, paidDate: true },
  });

  // Monthly buckets for the selected year (invoices raised)
  const monthlyRaised: Record<number, number> = {};
  const monthlyPaid:   Record<number, number> = {};
  for (let m = 1; m <= 12; m++) { monthlyRaised[m] = 0; monthlyPaid[m] = 0; }

  for (const inv of invoices) {
    const d = new Date(inv.invoiceDate);
    if (d.getFullYear() === year) {
      const m = d.getMonth() + 1;
      monthlyRaised[m] = (monthlyRaised[m] ?? 0) + Number(inv.total);
    }
  }

  for (const p of payments) {
    const d = new Date(p.paidDate);
    if (d.getFullYear() === year) {
      const m = d.getMonth() + 1;
      monthlyPaid[m] = (monthlyPaid[m] ?? 0) + Number(p.amount);
    }
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthly = MONTHS.map((name, i) => ({
    month: name,
    raised: monthlyRaised[i + 1] ?? 0,
    collected: monthlyPaid[i + 1] ?? 0,
  }));

  // Yearly summary (all time, grouped by year)
  const yearlyMap: Record<number, { raised: number; collected: number }> = {};
  for (const inv of invoices) {
    const y = new Date(inv.invoiceDate).getFullYear();
    if (!yearlyMap[y]) yearlyMap[y] = { raised: 0, collected: 0 };
    yearlyMap[y].raised += Number(inv.total);
  }
  for (const p of payments) {
    const y = new Date(p.paidDate).getFullYear();
    if (!yearlyMap[y]) yearlyMap[y] = { raised: 0, collected: 0 };
    yearlyMap[y].collected += Number(p.amount);
  }
  const yearly = Object.entries(yearlyMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([yr, v]) => ({ year: Number(yr), ...v }));

  // Status breakdown (all time, this currency)
  const statusCounts: Record<string, number> = {};
  for (const inv of invoices) {
    statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1;
  }

  // Top clients by revenue (all time, this currency)
  const clientMap: Record<string, number> = {};
  for (const inv of invoices) {
    // We join client name later via the full invoice; here use clientId fallback
  }
  const topClients = await prisma.invoice.groupBy({
    by: ["clientName"],
    where: { currency, status: { not: "VOID" } },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  // Summary for selected year
  const yearInvoices = invoices.filter(inv => new Date(inv.invoiceDate).getFullYear() === year);
  const totalRaised    = yearInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalCollected = payments
    .filter(p => new Date(p.paidDate).getFullYear() === year)
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalOutstanding = yearInvoices
    .filter(i => i.status !== "PAID" && i.status !== "VOID")
    .reduce((s, i) => s + (Number(i.total) - Number(i.paidAmount)), 0);
  const countRaised = yearInvoices.length;
  const countPaid   = yearInvoices.filter(i => i.status === "PAID").length;

  // Available years for the year selector
  const years = Array.from(new Set(invoices.map(i => new Date(i.invoiceDate).getFullYear()))).sort((a,b) => b - a);
  if (!years.includes(year)) years.unshift(year);

  // Available currencies
  const currencies = await prisma.invoice.findMany({
    distinct: ["currency"],
    select: { currency: true },
    where: { status: { not: "VOID" } },
  });

  return NextResponse.json({
    year,
    currency,
    monthly,
    yearly,
    statusCounts,
    topClients: topClients.map(c => ({ name: c.clientName, total: Number(c._sum.total ?? 0) })),
    summary: { totalRaised, totalCollected, totalOutstanding, countRaised, countPaid },
    years,
    currencies: currencies.map(c => c.currency),
  });
}
