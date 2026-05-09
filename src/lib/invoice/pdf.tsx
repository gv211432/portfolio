/**
 * Server-side invoice PDF generation using PDFKit.
 * Pure Node.js — zero React dependency, zero bundling conflict.
 */
import PDFDocument from "pdfkit";

export interface PdfLineItem {
  dateLabel: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface PdfPaymentInfo {
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  branch?: string | null;
  upiId?: string | null;
  paypalOther?: string | null;
}

export interface PdfCompany {
  name: string;
  address: string;
  email?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
}

export interface PdfInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  clientName: string;
  clientAddress?: string | null;
  items: PdfLineItem[];
  subtotal: number;
  adjustment: number;
  total: number;
  gstEnabled?: boolean;
  gstRate?: number | null;
  gstAmount?: number | null;
  paymentInfo?: PdfPaymentInfo | null;
  company: PdfCompany;
}

// ─── Design constants ─────────────────────────────────────────────────────────
const PURPLE  = "#667eea";
const DPURPLE = "#764ba2";
const DARK    = "#1a1a2e";
const WHITE   = "#ffffff";
const GREY    = "#888888";
const LTGREY  = "#f0f0f0";
const TEXT    = "#333333";
const SUBDUED = "#555555";

const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 36;
const BODY_W  = PAGE_W - MARGIN * 2;

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtNum(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── HEADER ────────────────────────────────────────────────────────────────
    const HEADER_H = 96;
    doc.rect(0, 0, PAGE_W, HEADER_H).fill(PURPLE);

    // Logo circle
    const CX = MARGIN + 22, CY = 48;
    doc.circle(CX, CY, 22).fillOpacity(0.25).fill(WHITE).fillOpacity(1);
    doc.font("Helvetica-Bold").fontSize(20).fill(WHITE)
      .text("G", CX - 7, CY - 11);

    // Company details (right-aligned)
    const co = data.company;
    doc.font("Helvetica-Bold").fontSize(13).fill(WHITE);
    const coNameW = doc.widthOfString(co.name);
    doc.text(co.name, PAGE_W - MARGIN - coNameW, 18);

    doc.font("Helvetica").fontSize(8).fillOpacity(0.8).fill(WHITE);
    let hy = 35;
    for (const line of co.address.split("\n")) {
      if (!line.trim()) continue;
      const lw = doc.widthOfString(line);
      doc.text(line, PAGE_W - MARGIN - lw, hy);
      hy += 11;
    }
    if (co.email) {
      const ew = doc.widthOfString(co.email);
      doc.text(co.email, PAGE_W - MARGIN - ew, hy);
      hy += 11;
    }
    if (co.gstNumber) {
      const gw = doc.widthOfString(`GST: ${co.gstNumber}`);
      doc.text(`GST: ${co.gstNumber}`, PAGE_W - MARGIN - gw, hy);
    }
    doc.fillOpacity(1);

    // ── BILL TO + META ────────────────────────────────────────────────────────
    let y = HEADER_H + 24;

    // Bill To
    doc.font("Helvetica-Bold").fontSize(7).fill(GREY)
      .text("BILL TO", MARGIN, y, { characterSpacing: 0.8 });
    y += 14;

    doc.font("Helvetica-Bold").fontSize(14).fill(DARK)
      .text(data.clientName, MARGIN, y);
    y += 18;

    if (data.clientAddress) {
      doc.font("Helvetica").fontSize(8).fill(SUBDUED)
        .text(data.clientAddress, MARGIN, y, { width: 200, lineGap: 2 });
      const addrH = doc.heightOfString(data.clientAddress, { width: 200, lineGap: 2 });
      y += addrH + 6;
    }

    // Invoice meta (right column, aligned to top of bill-to)
    const metaTop = HEADER_H + 24;
    const metaX = PAGE_W - MARGIN - 170;
    const metaRows = [
      ["Invoice Date", data.invoiceDate],
      ["Due Date",     data.dueDate],
      ["Terms",        data.paymentTerms],
      ["Currency",     data.currency],
    ];
    // Invoice number
    doc.font("Helvetica-Bold").fontSize(20).fill(PURPLE)
      .text(data.invoiceNumber, metaX, metaTop, { width: 170, align: "right" });

    let my = metaTop + 26;
    for (const [k, v] of metaRows) {
      doc.font("Helvetica").fontSize(7).fill(GREY)
        .text(k.toUpperCase(), metaX, my, { width: 80, align: "right", characterSpacing: 0.4 });
      doc.font("Helvetica-Bold").fontSize(8).fill(TEXT)
        .text(v, metaX + 85, my, { width: 85, align: "right" });
      my += 13;
    }

    // Advance y past whichever block is taller
    y = Math.max(y, my + 10);

    // ── LINE ITEMS TABLE ──────────────────────────────────────────────────────
    const COL_H_X  = PAGE_W - MARGIN - 65 - 60 - 60;
    const COL_R_X  = PAGE_W - MARGIN - 65 - 60;
    const COL_A_X  = PAGE_W - MARGIN - 65;
    const COL_W_H  = 60;
    const COL_W_R  = 60;
    const COL_W_A  = 65;
    const COL_W_D  = COL_H_X - MARGIN;
    const ROW_H    = 28;
    const TH_H     = 20;

    // Table header
    doc.rect(MARGIN, y, BODY_W, TH_H).fill(PURPLE);
    doc.font("Helvetica-Bold").fontSize(7).fill(WHITE).fillOpacity(0.9);
    doc.text("DESCRIPTION", MARGIN + 8, y + 6, { width: COL_W_D - 8 });
    doc.text("HOURS",   COL_H_X, y + 6, { width: COL_W_H, align: "right" });
    doc.text("RATE",    COL_R_X, y + 6, { width: COL_W_R, align: "right" });
    doc.text("AMOUNT",  COL_A_X, y + 6, { width: COL_W_A, align: "right" });
    doc.fillOpacity(1);
    y += TH_H;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const isAlt = i % 2 === 1;

      // Measure description height
      let descText = item.description || "—";
      const descH = doc.font("Helvetica").fontSize(8)
        .heightOfString(descText, { width: COL_W_D - 12, lineGap: 2 });
      const badgeH = item.dateLabel ? 14 : 0;
      const rowH = Math.max(ROW_H, descH + badgeH + 10);

      // Row background
      if (isAlt) doc.rect(MARGIN, y, BODY_W, rowH).fill("#f5f5ff");
      doc.rect(MARGIN, y + rowH - 1, BODY_W, 1).fill(LTGREY);

      // Date badge
      let descY = y + 6;
      if (item.dateLabel) {
        const badgeW = doc.font("Helvetica-Bold").fontSize(6)
          .widthOfString(item.dateLabel) + 8;
        doc.rect(MARGIN + 8, y + 5, badgeW, 10).fill(PURPLE);
        doc.font("Helvetica-Bold").fontSize(6).fill(WHITE)
          .text(item.dateLabel, MARGIN + 12, y + 7);
        descY = y + 18;
      }

      // Description
      doc.font("Helvetica").fontSize(8).fill(TEXT)
        .text(descText, MARGIN + 8, descY, { width: COL_W_D - 12, lineGap: 2 });

      // Numeric columns (vertically centered)
      const numY = y + (rowH - 8) / 2;
      doc.font("Helvetica").fontSize(8).fill(TEXT);
      doc.text(fmtNum(item.hours), COL_H_X, numY, { width: COL_W_H, align: "right" });
      doc.text(fmt(item.rate, data.currency), COL_R_X, numY, { width: COL_W_R, align: "right" });
      doc.font("Helvetica-Bold").fill(DARK)
        .text(fmt(item.amount, data.currency), COL_A_X, numY, { width: COL_W_A, align: "right" });

      y += rowH;
    }

    y += 16;

    // ── SUMMARY BOX ───────────────────────────────────────────────────────────
    const totalHours = data.items.reduce((s, i) => s + i.hours, 0);
    const summaryRows: [string, string][] = [
      ["Total Hours", `${fmtNum(totalHours)} hrs`],
      ["Subtotal",    fmt(data.subtotal, data.currency)],
    ];
    if (data.adjustment !== 0) {
      summaryRows.push(["Adjustment", fmt(data.adjustment, data.currency)]);
    }
    if (data.gstEnabled && data.gstAmount != null) {
      summaryRows.push([`GST (${data.gstRate}%)`, fmt(data.gstAmount, data.currency)]);
    }

    const BOX_W = 200;
    const BOX_X = PAGE_W - MARGIN - BOX_W;
    const ROW_H2 = 14;
    const boxInnerH = summaryRows.length * ROW_H2 + 1 + 18; // rows + divider + total row
    const BOX_H = boxInnerH + 20;

    doc.roundedRect(BOX_X, y, BOX_W, BOX_H, 4).fill(DARK);

    let by = y + 12;
    for (const [label, value] of summaryRows) {
      doc.font("Helvetica").fontSize(8).fill("rgba(255,255,255,0.65)")
        .text(label, BOX_X + 12, by, { width: 90 });
      doc.font("Helvetica").fontSize(8).fill(WHITE)
        .text(value, BOX_X + 12, by, { width: BOX_W - 24, align: "right" });
      by += ROW_H2;
    }

    // Divider
    doc.moveTo(BOX_X + 12, by + 3).lineTo(BOX_X + BOX_W - 12, by + 3)
      .strokeColor("rgba(255,255,255,0.2)").lineWidth(0.5).stroke();
    by += 10;

    // Total
    doc.font("Helvetica-Bold").fontSize(11).fill(WHITE)
      .text("Total Due", BOX_X + 12, by, { width: 90 });
    doc.font("Helvetica-Bold").fontSize(11).fill("#a78bfa")
      .text(fmt(data.total, data.currency), BOX_X + 12, by, { width: BOX_W - 24, align: "right" });

    y += BOX_H + 20;

    // ── PAYMENT INFO ──────────────────────────────────────────────────────────
    const payFields: { label: string; value: string }[] = [
      { label: "Account Name",  value: data.paymentInfo?.accountName ?? "" },
      { label: "Bank Name",     value: data.paymentInfo?.bankName ?? "" },
      { label: "Account No.",   value: data.paymentInfo?.accountNumber ?? "" },
      { label: "IFSC Code",     value: data.paymentInfo?.ifscCode ?? "" },
      { label: "SWIFT Code",    value: data.paymentInfo?.swiftCode ?? "" },
      { label: "Branch",        value: data.paymentInfo?.branch ?? "" },
      { label: "UPI ID",        value: data.paymentInfo?.upiId ?? "" },
      { label: "PayPal / Other",value: data.paymentInfo?.paypalOther ?? "" },
    ].filter((f) => f.value.trim() !== "");

    if (payFields.length > 0) {
      doc.font("Helvetica-Bold").fontSize(7).fill(GREY)
        .text("PAYMENT INFORMATION", MARGIN, y, { characterSpacing: 0.8 });
      y += 14;

      const colW = BODY_W / 3;
      let col = 0;
      let rowStartY = y;

      for (const f of payFields) {
        const px = MARGIN + col * colW;
        doc.font("Helvetica").fontSize(6).fill(GREY).fillOpacity(0.8)
          .text(f.label.toUpperCase(), px, rowStartY, { characterSpacing: 0.4 });
        doc.font("Helvetica-Bold").fontSize(8).fill(TEXT).fillOpacity(1)
          .text(f.value, px, rowStartY + 10);
        col++;
        if (col === 3) {
          col = 0;
          rowStartY += 28;
        }
      }
      y = rowStartY + (col > 0 ? 28 : 0) + 12;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const FOOTER_H = 40;
    const footerY = PAGE_H - FOOTER_H;
    doc.rect(0, footerY, PAGE_W, FOOTER_H).fill(DPURPLE);

    doc.font("Helvetica-Bold").fontSize(10).fill(WHITE)
      .text("Thank you for your business!", MARGIN, footerY + 14);

    const noteStr = `Computer-generated invoice · ${new Date().toLocaleDateString("en-IN")}`;
    const noteW = doc.font("Helvetica").fontSize(7).widthOfString(noteStr);
    doc.fill("rgba(255,255,255,0.6)")
      .text(noteStr, PAGE_W - MARGIN - noteW, footerY + 16);

    doc.end();
  });
}
