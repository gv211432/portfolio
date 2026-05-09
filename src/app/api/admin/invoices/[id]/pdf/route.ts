import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { generateInvoicePdf } from "@/lib/invoice/pdf";
import { uploadPdf, signedPdfUrl } from "@/lib/invoice/s3";
import { decryptOpt } from "@/lib/invoice/encryption";
import type { PdfInvoiceData, PdfCompany, PdfPaymentInfo } from "@/lib/invoice/pdf";

type Params = { params: Promise<{ id: string }> };

/** GET — returns a short-lived pre-signed download URL for the latest PDF. */
export async function GET(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!invoice.pdfS3Key) return NextResponse.json({ error: "PDF not generated yet" }, { status: 404 });

  const url = await signedPdfUrl(id, 900, invoice.currentVersion);
  return NextResponse.json({ url, expiresIn: 900, version: invoice.currentVersion });
}

/** POST — generate PDF, upload versioned copy to S3, finalize invoice. */
export async function POST(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "SIGNED") {
    return NextResponse.json({ error: "Signed invoices cannot be regenerated" }, { status: 400 });
  }
  if (invoice.isLocked && invoice.status !== "DRAFT") {
    return NextResponse.json({ error: "Invoice is locked. Unlock it to regenerate." }, { status: 400 });
  }

  const company = await prisma.invoiceCompanyProfile.findUnique({ where: { id: "default" } });

  let paymentInfo: PdfPaymentInfo | null = null;
  if (invoice.paymentProfileId) {
    const pp = await prisma.invoicePaymentProfile.findUnique({ where: { id: invoice.paymentProfileId } });
    if (pp) {
      paymentInfo = {
        accountName:   decryptOpt(pp.accountNameEnc),
        bankName:      decryptOpt(pp.bankNameEnc),
        accountNumber: decryptOpt(pp.accountNumberEnc),
        ifscCode:      decryptOpt(pp.ifscCodeEnc),
        swiftCode:     decryptOpt(pp.swiftCodeEnc),
        branch:        pp.branch,
        upiId:         decryptOpt(pp.upiIdEnc),
        paypalOther:   decryptOpt(pp.paypalOtherEnc),
      };
    }
  }

  const pdfCompany: PdfCompany = {
    name:      company?.name || "Gaurav Dot One",
    address:   company?.address || "",
    email:     company?.email,
    phone:     company?.phone,
    gstNumber: company?.gstNumber,
  };

  const pdfData: PdfInvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate:   new Date(invoice.invoiceDate).toLocaleDateString("en-IN"),
    dueDate:       new Date(invoice.dueDate).toLocaleDateString("en-IN"),
    paymentTerms:  invoice.paymentTerms,
    currency:      invoice.currency,
    clientName:    invoice.clientName,
    clientAddress: invoice.clientAddress,
    items: invoice.items.map((item) => ({
      dateLabel:   item.dateLabel,
      description: item.description,
      hours:       Number(item.hours),
      rate:        Number(item.rate),
      amount:      Number(item.amount),
    })),
    subtotal:   Number(invoice.subtotal),
    adjustment: Number(invoice.adjustment),
    total:      Number(invoice.total),
    gstEnabled: invoice.gstEnabled,
    gstRate:    invoice.gstRate ? Number(invoice.gstRate) : null,
    gstAmount:  invoice.gstAmount ? Number(invoice.gstAmount) : null,
    paymentInfo,
    company: pdfCompany,
  };

  const buffer = await generateInvoicePdf(pdfData);

  // Bump version
  const nextVersion = invoice.currentVersion + 1;
  const s3Key = await uploadPdf(id, buffer, nextVersion);

  // Persist version record + update invoice atomically
  const [, updated] = await prisma.$transaction([
    prisma.invoiceVersion.create({
      data: { invoiceId: id, version: nextVersion, pdfS3Key: s3Key },
    }),
    prisma.invoice.update({
      where: { id },
      data: {
        pdfS3Key:            s3Key,
        pdfGeneratedAt:      new Date(),
        currentVersion:      nextVersion,
        status:              "FINALIZED",
        paymentInfoSnapshot: paymentInfo as object,
        companySnapshot:     pdfCompany as object,
      },
    }),
  ]);

  const url = await signedPdfUrl(id, 900, nextVersion);
  return NextResponse.json({ url, expiresIn: 900, version: nextVersion, invoice: updated });
}
