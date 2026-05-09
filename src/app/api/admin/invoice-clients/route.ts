import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";
  const autocomplete = searchParams.get("autocomplete") === "true";

  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (autocomplete) {
    // Lightweight list for autocomplete dropdowns
    const clients = await prisma.invoiceClient.findMany({
      where,
      orderBy: { name: "asc" },
      take: 20,
      select: { id: true, name: true, email: true, address: true, defaultCurrency: true },
    });
    return NextResponse.json({ clients });
  }

  const [clients, total] = await Promise.all([
    prisma.invoiceClient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoiceClient.count({ where }),
  ]);

  return NextResponse.json({ clients, total, page, limit });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, email, phone, defaultCurrency = "USD", notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  const client = await prisma.invoiceClient.create({
    data: {
      name: name.trim(),
      address: address?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      defaultCurrency,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
