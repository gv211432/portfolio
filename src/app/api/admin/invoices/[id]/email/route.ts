import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { downloadPdf, signedPdfUrl } from "@/lib/invoice/s3";
import { generateInvoicePdf } from "@/lib/invoice/pdf";
import { decryptOpt } from "@/lib/invoice/encryption";
import { INVOICE_ENV } from "@/lib/invoice/env";
import { sendViaSes } from "@/lib/mail/ses";
import type { PdfInvoiceData, PdfCompany, PdfPaymentInfo } from "@/lib/invoice/pdf";

type Params = { params: Promise<{ id: string }> };

function buildEmailHtml(opts: {
  invoiceNumber: string;
  clientName: string;
  total: string;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  downloadUrl: string;
  message: string;
  companyName: string;
  companyEmail: string;
}): string {
  const { invoiceNumber, clientName, total, currency, invoiceDate, dueDate, downloadUrl, message, companyName, companyEmail } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px;text-align:right;">
          <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:.5px;">${companyName}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;">${companyEmail}</div>
        </td></tr>
        <!-- Invoice badge -->
        <tr><td style="padding:28px 32px 0;">
          <div style="font-size:24px;font-weight:700;color:#667eea;">${invoiceNumber}</div>
          <div style="margin-top:8px;font-size:14px;color:#555;">
            <span>Invoice Date: <strong>${invoiceDate}</strong></span> &nbsp;·&nbsp;
            <span>Due: <strong>${dueDate}</strong></span>
          </div>
        </td></tr>
        <!-- Greeting + message -->
        <tr><td style="padding:20px 32px;">
          <p style="margin:0 0 12px;font-size:15px;color:#222;">Dear <strong>${clientName}</strong>,</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">${message.replace(/\n/g, "<br>")}</p>
        </td></tr>
        <!-- Total box -->
        <tr><td style="padding:0 32px 28px;">
          <table cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:10px;width:100%;">
            <tr>
              <td style="padding:18px 24px;color:rgba(255,255,255,.65);font-size:13px;">Total Due</td>
              <td style="padding:18px 24px;text-align:right;font-size:18px;font-weight:700;color:#a78bfa;">${total} ${currency}</td>
            </tr>
          </table>
        </td></tr>
        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${downloadUrl}" style="display:inline-block;padding:13px 32px;background:#667eea;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
            Download Invoice PDF
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#999;">This link expires in 24 hours. The PDF is also attached to this email.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#764ba2;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,.75);">
            Thank you for your business — ${companyName}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { toEmail, toName, subject, message } = body as {
    toEmail: string;
    toName?: string;
    subject?: string;
    message?: string;
  };

  if (!toEmail?.trim()) {
    return NextResponse.json({ error: "toEmail is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "DRAFT") {
    return NextResponse.json({ error: "Generate a PDF before sending the invoice" }, { status: 400 });
  }
  if (invoice.status === "VOID") {
    return NextResponse.json({ error: "Cannot email a voided invoice" }, { status: 400 });
  }

  // Get PDF — download existing or generate on-the-fly
  let pdfBuffer: Buffer;
  if (invoice.pdfS3Key) {
    pdfBuffer = await downloadPdf(id);
  } else {
    // Generate without saving (unsigned send case)
    const company = await prisma.invoiceCompanyProfile.findUnique({ where: { id: "default" } });
    let paymentInfo: PdfPaymentInfo | null = null;
    if (invoice.paymentProfileId) {
      const pp = await prisma.invoicePaymentProfile.findUnique({ where: { id: invoice.paymentProfileId } });
      if (pp) {
        paymentInfo = {
          accountName: decryptOpt(pp.accountNameEnc),
          bankName: decryptOpt(pp.bankNameEnc),
          accountNumber: decryptOpt(pp.accountNumberEnc),
          ifscCode: decryptOpt(pp.ifscCodeEnc),
          swiftCode: decryptOpt(pp.swiftCodeEnc),
          branch: pp.branch,
          upiId: decryptOpt(pp.upiIdEnc),
          paypalOther: decryptOpt(pp.paypalOtherEnc),
        };
      }
    }
    const pdfCompany: PdfCompany = {
      name: company?.name || "Gaurav Dot One",
      address: company?.address || "",
      email: company?.email,
      phone: company?.phone,
      gstNumber: company?.gstNumber,
    };
    const pdfData: PdfInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString("en-IN"),
      dueDate: new Date(invoice.dueDate).toLocaleDateString("en-IN"),
      paymentTerms: invoice.paymentTerms,
      currency: invoice.currency,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      items: invoice.items.map((item) => ({
        dateLabel: item.dateLabel,
        description: item.description,
        hours: Number(item.hours),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
      subtotal: Number(invoice.subtotal),
      adjustment: Number(invoice.adjustment),
      total: Number(invoice.total),
      gstEnabled: invoice.gstEnabled,
      gstRate: invoice.gstRate ? Number(invoice.gstRate) : null,
      gstAmount: invoice.gstAmount ? Number(invoice.gstAmount) : null,
      paymentInfo,
      company: pdfCompany,
    };
    pdfBuffer = await generateInvoicePdf(pdfData);
  }

  // 24h signed download link
  const downloadUrl = await signedPdfUrl(id, 86400);

  const company = await prisma.invoiceCompanyProfile.findUnique({ where: { id: "default" } });
  const companyName = company?.name || "Gaurav Dot One";
  const companyEmail = company?.email || INVOICE_ENV.SES_FROM_EMAIL;

  const emailSubject = subject?.trim() || `Invoice ${invoice.invoiceNumber} from ${companyName}`;
  const emailMessage = message?.trim() ||
    `Please find your invoice ${invoice.invoiceNumber} attached. The total amount due is ${Number(invoice.total).toFixed(2)} ${invoice.currency}.\n\nPlease make payment by ${new Date(invoice.dueDate).toLocaleDateString("en-IN")} as per the payment terms.`;

  const htmlBody = buildEmailHtml({
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    total: Number(invoice.total).toFixed(2),
    currency: invoice.currency,
    invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString("en-IN"),
    dueDate: new Date(invoice.dueDate).toLocaleDateString("en-IN"),
    downloadUrl,
    message: emailMessage,
    companyName,
    companyEmail,
  });

  // Create log entry (PENDING before send)
  const emailLog = await prisma.invoiceEmailLog.create({
    data: {
      invoiceId: id,
      toEmail: toEmail.trim(),
      toName: toName?.trim() || null,
      subject: emailSubject,
      status: "PENDING",
    },
  });

  try {
    const result = await sendViaSes({
      from: { email: INVOICE_ENV.SES_FROM_EMAIL, name: companyName },
      to: [{ email: toEmail.trim(), name: toName?.trim() || invoice.clientName }],
      subject: emailSubject,
      bodyText: emailMessage,
      bodyHtml: htmlBody,
      attachments: [{
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        contentType: "application/pdf",
        content: pdfBuffer,
      }],
    });

    await prisma.invoiceEmailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "SENT",
        sesMessageId: result.sesMessageId,
        sentAt: new Date(),
      },
    });

    // Advance status to SENT if still FINALIZED
    if (invoice.status === "FINALIZED") {
      await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
    }

    const updated = await prisma.invoiceEmailLog.findUnique({ where: { id: emailLog.id } });
    return NextResponse.json({ emailLog: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.invoiceEmailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED", error: message },
    });
    return NextResponse.json({ error: `Email send failed: ${message}` }, { status: 500 });
  }
}

/** GET — return email log for this invoice */
export async function GET(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const logs = await prisma.invoiceEmailLog.findMany({
    where: { invoiceId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ logs });
}
