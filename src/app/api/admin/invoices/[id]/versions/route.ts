import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { signedPdfUrl } from "@/lib/invoice/s3";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.versions.list");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const versions = await prisma.invoiceVersion.findMany({
    where: { invoiceId: id },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ versions });
}

/** GET a signed URL for a specific version */
export async function POST(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.versions.download");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const { version } = await req.json() as { version: number };

  const record = await prisma.invoiceVersion.findUnique({
    where: { invoiceId_version: { invoiceId: id, version } },
  });
  if (!record) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const url = await signedPdfUrl(id, 900, version);
  return NextResponse.json({ url, expiresIn: 900 });
}
