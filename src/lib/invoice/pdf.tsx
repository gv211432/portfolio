/**
 * Server-side invoice PDF generation — PDFKit, zero React dependency.
 * Design: purple gradient header, Cinzel Decorative headings, Helvetica body.
 */
import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

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

// ─── Design tokens ────────────────────────────────────────────────────────────
const PURPLE  = "#667eea";
const DPURPLE = "#764ba2";
const DARK    = "#1a1a2e";
const WHITE   = "#ffffff";
const GREY    = "#888888";
const LTGREY  = "#eeeeee";
const TEXT    = "#333333";
const SUBDUED = "#666666";
const ACCENT  = "#a78bfa";

const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 36;
const BODY_W  = PAGE_W - MARGIN * 2;

// Font paths (Cinzel Decorative — downloaded to public/fonts)
const FONTS_DIR   = path.join(process.cwd(), "public", "fonts");
const CINZEL_REG  = path.join(FONTS_DIR, "CinzelDecorative-Regular.ttf");
const CINZEL_BOLD = path.join(FONTS_DIR, "CinzelDecorative-Bold.ttf");
const LOGO_PATH   = path.join(process.cwd(), "public", "img", "logo", "gaurav-dot-one-transparent-gray.webp");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function fmtNum(n: number): string { return n % 1 === 0 ? String(n) : n.toFixed(2); }

/** Convert WebP logo → PNG buffer for pdfkit (which doesn't support WebP). */
async function logoBuffer(): Promise<Buffer | null> {
  try {
    if (!fs.existsSync(LOGO_PATH)) return null;
    return await sharp(LOGO_PATH).png().toBuffer();
  } catch { return null; }
}

function cinzelAvailable(): boolean {
  return fs.existsSync(CINZEL_REG) && fs.existsSync(CINZEL_BOLD);
}

// ─── PDF builder ─────────────────────────────────────────────────────────────
export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const [logo, hasCinzel] = await Promise.all([logoBuffer(), Promise.resolve(cinzelAvailable())]);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (hasCinzel) {
      doc.registerFont("CinzelReg",  CINZEL_REG);
      doc.registerFont("CinzelBold", CINZEL_BOLD);
    }

    const cinzel  = hasCinzel ? "CinzelReg"  : "Helvetica";
    const cinzelB = hasCinzel ? "CinzelBold" : "Helvetica-Bold";

    // ── HEADER ────────────────────────────────────────────────────────────────
    const HEADER_H = 100;

    // Gradient simulation: two overlapping rectangles
    doc.rect(0, 0, PAGE_W, HEADER_H).fill(PURPLE);
    doc.rect(PAGE_W * 0.6, 0, PAGE_W * 0.4, HEADER_H).fillOpacity(0.35).fill(DPURPLE).fillOpacity(1);

    // Logo
    const LOGO_X = MARGIN, LOGO_Y = 22, LOGO_SIZE = 56;
    if (logo) {
      // White circle background
      doc.circle(LOGO_X + LOGO_SIZE / 2, LOGO_Y + LOGO_SIZE / 2, LOGO_SIZE / 2 + 2)
        .fillOpacity(0.25).fill(WHITE).fillOpacity(1);
      doc.image(logo, LOGO_X, LOGO_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
    } else {
      doc.circle(LOGO_X + 28, LOGO_Y + 28, 28).fillOpacity(0.25).fill(WHITE).fillOpacity(1);
      doc.font("Helvetica-Bold").fontSize(22).fill(WHITE).text("G", LOGO_X + 18, LOGO_Y + 18);
    }

    // Company name (Cinzel Decorative — the premium touch)
    const co = data.company;
    doc.font(cinzelB).fontSize(12).fill(WHITE);
    const nameLines = co.name.length > 32
      ? [co.name.slice(0, co.name.lastIndexOf(" ", 32)), co.name.slice(co.name.lastIndexOf(" ", 32) + 1)]
      : [co.name];

    let nameY = nameLines.length === 2 ? 20 : 28;
    for (const line of nameLines) {
      const lw = doc.widthOfString(line);
      doc.text(line, PAGE_W - MARGIN - lw, nameY);
      nameY += 17;
    }

    // Company meta (address, email, GST)
    doc.font("Helvetica").fontSize(7.5).fillOpacity(0.82).fill(WHITE);
    let hy = nameY + 3;
    for (const line of co.address.split("\n")) {
      if (!line.trim()) continue;
      const lw = doc.widthOfString(line);
      doc.text(line, PAGE_W - MARGIN - lw, hy);
      hy += 10.5;
    }
    if (co.email) {
      const ew = doc.widthOfString(co.email);
      doc.text(co.email, PAGE_W - MARGIN - ew, hy); hy += 10.5;
    }
    if (co.gstNumber) {
      const gstr = `GST: ${co.gstNumber}`;
      const gw = doc.widthOfString(gstr);
      doc.text(gstr, PAGE_W - MARGIN - gw, hy);
    }
    doc.fillOpacity(1);

    // ── BILL TO + INVOICE META ────────────────────────────────────────────────
    let y = HEADER_H + 26;

    doc.font("Helvetica-Bold").fontSize(6.5).fill(GREY)
      .text("BILL TO", MARGIN, y, { characterSpacing: 1.2 });
    y += 13;

    doc.font(cinzelB).fontSize(15).fill(DARK).text(data.clientName, MARGIN, y);
    y += 19;

    if (data.clientAddress) {
      doc.font("Helvetica").fontSize(8).fill(SUBDUED)
        .text(data.clientAddress, MARGIN, y, { width: 210, lineGap: 2 });
      y += doc.heightOfString(data.clientAddress, { width: 210, lineGap: 2 }) + 8;
    }

    // Meta block — right side, aligned to bill-to top
    const metaTop = HEADER_H + 26;
    const metaBlockW = 175;
    const metaX = PAGE_W - MARGIN - metaBlockW;

    // Invoice number (Cinzel — makes it feel like a proper document)
    doc.font(cinzel).fontSize(22).fill(PURPLE)
      .text(data.invoiceNumber, metaX, metaTop, { width: metaBlockW, align: "right" });

    const metaRows: [string, string][] = [
      ["Invoice Date", data.invoiceDate],
      ["Due Date",     data.dueDate],
      ["Terms",        data.paymentTerms],
      ["Currency",     data.currency],
    ];
    let my = metaTop + 30;
    for (const [k, v] of metaRows) {
      doc.font("Helvetica").fontSize(7).fill(GREY)
        .text(k.toUpperCase(), metaX, my, { width: 85, align: "right", characterSpacing: 0.4 });
      doc.font("Helvetica-Bold").fontSize(8).fill(TEXT)
        .text(v, metaX + 88, my, { width: metaBlockW - 88, align: "right" });
      my += 13;
    }

    y = Math.max(y, my + 10);

    // ── THIN ACCENT LINE ──────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.5).strokeColor(LTGREY).stroke();
    y += 14;

    // ── LINE ITEMS TABLE ──────────────────────────────────────────────────────
    const COL_A_X  = PAGE_W - MARGIN - 70;
    const COL_R_X  = COL_A_X - 62;
    const COL_H_X  = COL_R_X - 62;
    const COL_W_D  = COL_H_X - MARGIN;
    const TH_H     = 20;

    // Table header
    doc.rect(MARGIN, y, BODY_W, TH_H).fill(PURPLE);
    doc.font("Helvetica-Bold").fontSize(7).fill(WHITE).fillOpacity(0.9);
    doc.text("DESCRIPTION", MARGIN + 8, y + 7, { width: COL_W_D });
    doc.text("HOURS",  COL_H_X, y + 7, { width: 55, align: "right" });
    doc.text("RATE",   COL_R_X, y + 7, { width: 55, align: "right" });
    doc.text("AMOUNT", COL_A_X, y + 7, { width: 70, align: "right" });
    doc.fillOpacity(1);
    y += TH_H;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const descText = item.description || "—";
      const badgeH   = item.dateLabel ? 14 : 0;
      const descH    = doc.font("Helvetica").fontSize(8)
        .heightOfString(descText, { width: COL_W_D - 12, lineGap: 2 });
      const rowH = Math.max(30, descH + badgeH + 12);

      if (i % 2 === 1) doc.rect(MARGIN, y, BODY_W, rowH).fill("#f7f7ff");
      doc.rect(MARGIN, y + rowH - 1, BODY_W, 0.5).fill(LTGREY);

      let descY = y + 7;
      if (item.dateLabel) {
        const bw = doc.font("Helvetica-Bold").fontSize(6).widthOfString(item.dateLabel) + 8;
        doc.rect(MARGIN + 8, y + 6, bw, 10).fill(PURPLE);
        doc.font("Helvetica-Bold").fontSize(6).fill(WHITE).text(item.dateLabel, MARGIN + 12, y + 8);
        descY = y + 20;
      }

      doc.font("Helvetica").fontSize(8).fill(TEXT)
        .text(descText, MARGIN + 8, descY, { width: COL_W_D - 12, lineGap: 2 });

      const numY = y + (rowH - 9) / 2;
      doc.font("Helvetica").fontSize(8).fill(SUBDUED);
      doc.text(fmtNum(item.hours), COL_H_X, numY, { width: 55, align: "right" });
      doc.text(fmt(item.rate, data.currency), COL_R_X, numY, { width: 55, align: "right" });
      doc.font("Helvetica-Bold").fill(DARK)
        .text(fmt(item.amount, data.currency), COL_A_X, numY, { width: 70, align: "right" });

      y += rowH;
    }
    y += 18;

    // ── SUMMARY BOX ───────────────────────────────────────────────────────────
    const totalHours = data.items.reduce((s, i) => s + i.hours, 0);
    const rows: [string, string][] = [
      ["Total Hours", `${fmtNum(totalHours)} hrs`],
      ["Subtotal",    fmt(data.subtotal, data.currency)],
    ];
    if (data.adjustment !== 0) rows.push(["Adjustment", fmt(data.adjustment, data.currency)]);
    if (data.gstEnabled && data.gstAmount != null)
      rows.push([`GST (${data.gstRate}%)`, fmt(data.gstAmount, data.currency)]);

    const BOX_W = 210;
    const BOX_X = PAGE_W - MARGIN - BOX_W;
    const BOX_H = rows.length * 15 + 32;
    doc.roundedRect(BOX_X, y, BOX_W, BOX_H, 5).fill(DARK);

    let by = y + 12;
    for (const [lbl, val] of rows) {
      doc.font("Helvetica").fontSize(8).fill("rgba(255,255,255,0.6)")
        .text(lbl, BOX_X + 12, by, { width: 95 });
      doc.font("Helvetica").fontSize(8).fill(WHITE)
        .text(val, BOX_X + 12, by, { width: BOX_W - 24, align: "right" });
      by += 15;
    }
    // Divider
    doc.moveTo(BOX_X + 12, by + 3).lineTo(BOX_X + BOX_W - 12, by + 3)
      .lineWidth(0.5).strokeColor("rgba(255,255,255,0.2)").stroke();
    by += 10;
    // Total (Cinzel for the grand total line)
    doc.font(cinzelB).fontSize(10).fill(WHITE)
      .text("Total Due", BOX_X + 12, by, { width: 95 });
    doc.font(cinzelB).fontSize(10).fill(ACCENT)
      .text(fmt(data.total, data.currency), BOX_X + 12, by, { width: BOX_W - 24, align: "right" });

    y += BOX_H + 20;

    // ── PAYMENT INFO ──────────────────────────────────────────────────────────
    const payFields = [
      ["Account Name",   data.paymentInfo?.accountName],
      ["Bank Name",      data.paymentInfo?.bankName],
      ["Account No.",    data.paymentInfo?.accountNumber],
      ["IFSC Code",      data.paymentInfo?.ifscCode],
      ["SWIFT Code",     data.paymentInfo?.swiftCode],
      ["Branch",         data.paymentInfo?.branch],
      ["UPI ID",         data.paymentInfo?.upiId],
      ["PayPal / Other", data.paymentInfo?.paypalOther],
    ].filter(([, v]) => v?.trim()) as [string, string][];

    if (payFields.length > 0) {
      doc.font("Helvetica-Bold").fontSize(6.5).fill(GREY)
        .text("PAYMENT INFORMATION", MARGIN, y, { characterSpacing: 1 });
      y += 14;

      // Draw a light box
      const colW = BODY_W / 3;
      const payRows = Math.ceil(payFields.length / 3);
      const payBoxH = payRows * 28 + 10;
      doc.rect(MARGIN, y, BODY_W, payBoxH).fill("#fafafa");
      doc.rect(MARGIN, y, BODY_W, 0.5).fill(LTGREY);
      doc.rect(MARGIN, y + payBoxH, BODY_W, 0.5).fill(LTGREY);

      let col = 0, py = y + 8;
      for (const [lbl, val] of payFields) {
        const px = MARGIN + col * colW + 8;
        doc.font("Helvetica").fontSize(6).fill(GREY).fillOpacity(0.8)
          .text(lbl.toUpperCase(), px, py, { characterSpacing: 0.4 });
        doc.font("Helvetica-Bold").fontSize(8).fill(TEXT).fillOpacity(1)
          .text(val, px, py + 9, { width: colW - 16 });
        col++;
        if (col === 3) { col = 0; py += 28; }
      }
      y += payBoxH + 16;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const FOOTER_H = 44;
    const footerY  = PAGE_H - FOOTER_H;
    doc.rect(0, footerY, PAGE_W, FOOTER_H).fill(DPURPLE);
    // Subtle left accent
    doc.rect(0, footerY, 4, FOOTER_H).fill(PURPLE);

    doc.font(cinzel).fontSize(10).fill(WHITE)
      .text("Thank you for your business!", MARGIN + 8, footerY + 16);

    const note = `Computer-generated invoice  ·  ${new Date().toLocaleDateString("en-IN")}`;
    const nw   = doc.font("Helvetica").fontSize(7).widthOfString(note);
    doc.fill("rgba(255,255,255,0.55)")
      .text(note, PAGE_W - MARGIN - nw, footerY + 18);

    doc.end();
  });
}
