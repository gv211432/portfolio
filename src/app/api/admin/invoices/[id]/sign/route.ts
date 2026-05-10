import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { downloadPdf } from "@/lib/invoice/s3";
import { initiateLeegalitySign } from "@/lib/invoice/leegality";

type Params = { params: Promise<{ id: string }> };

/** GET — return current signature status */
export async function GET(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.sign.status");
  if (!perm.ok) return perm.response;

  const { id } = await params;
  const log = await prisma.invoiceSignatureLog.findUnique({ where: { invoiceId: id } });

  if (!log) return NextResponse.json({ status: "NOT_INITIATED", signingUrl: null });

  return NextResponse.json({
    status: log.status,
    signingUrl: log.signingUrl,
    leegalityDocId: log.leegalityDocId,
    initiatedAt: log.initiatedAt,
    completedAt: log.completedAt,
    updatedAt: log.updatedAt,
  });
}

/** POST — initiate Leegality eSign for this invoice */
export async function POST(req: NextRequest, { params }: Params) {
  const perm = await requirePermission(req, "invoice.sign.initiate");
  if (!perm.ok) return perm.response;

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "SIGNED") {
    return NextResponse.json({ error: "Invoice is already signed" }, { status: 400 });
  }
  if (invoice.status === "VOID") {
    return NextResponse.json({ error: "Cannot sign a voided invoice" }, { status: 400 });
  }
  if (invoice.status === "DRAFT") {
    return NextResponse.json({ error: "Generate a PDF before initiating signing" }, { status: 400 });
  }
  if (!invoice.pdfS3Key) {
    return NextResponse.json({ error: "No PDF found — generate it first" }, { status: 400 });
  }

  // Fetch PDF from S3
  const pdfBuffer = await downloadPdf(id);

  const company = await prisma.invoiceCompanyProfile.findUnique({ where: { id: "default" } });
  const signerName = company?.name || "Gaurav Dot One";
  const signerEmail = company?.email || null;

  let result;
  try {
    result = await initiateLeegalitySign({
      invoiceNumber: invoice.invoiceNumber,
      signerName,
      signerEmail,
      pdfBuffer,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Leegality API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Upsert signature log
  const log = await prisma.invoiceSignatureLog.upsert({
    where: { invoiceId: id },
    create: {
      invoiceId: id,
      leegalityDocId: result.documentId,
      signingUrl: result.signingUrl,
      status: "SENT",
    },
    update: {
      leegalityDocId: result.documentId,
      signingUrl: result.signingUrl,
      status: "SENT",
    },
  });

  await prisma.invoice.update({
    where: { id },
    data: { status: "PENDING_SIGNATURE" },
  });

  return NextResponse.json({
    status: log.status,
    signingUrl: log.signingUrl,
    leegalityDocId: log.leegalityDocId,
    initiatedAt: log.initiatedAt,
  });
}
