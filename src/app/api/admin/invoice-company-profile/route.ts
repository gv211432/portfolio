import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "invoice_company.read");
  if (!perm.ok) return perm.response;

  const profile = await prisma.invoiceCompanyProfile.findUnique({
    where: { id: "default" },
  });

  return NextResponse.json({ profile: profile ?? null });
}

export async function PUT(req: NextRequest) {
  const perm = await requirePermission(req, "invoice_company.update");
  if (!perm.ok) return perm.response;

  const body = await req.json();
  const { name, address, email, phone, website, gstNumber, panNumber, logoS3Key } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const profile = await prisma.invoiceCompanyProfile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      name: name.trim(),
      address: address?.trim() ?? "",
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
      panNumber: panNumber?.trim() || null,
      logoS3Key: logoS3Key?.trim() || null,
    },
    update: {
      name: name.trim(),
      address: address?.trim() ?? "",
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
      panNumber: panNumber?.trim() || null,
      logoS3Key: logoS3Key?.trim() || null,
    },
  });

  return NextResponse.json({ profile });
}
