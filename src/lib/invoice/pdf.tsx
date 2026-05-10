/**
 * Server-side invoice PDF — faithful reproduction of invoice-gen/invoice.html
 * Fonts: Cinzel (headings) + Helvetica/Inter (body).  Library: PDFKit.
 */
import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

// ─── Public interface ─────────────────────────────────────────────────────────
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

// ─── Design tokens (matching the HTML exactly) ────────────────────────────────
const PURPLE    = "#667eea";
const PURPLE2   = "#764ba2";
const GREY_BG   = "#f9fafb";
const GREY_BDR  = "#e9ecef";
const GREY_TEXT = "#6b7280";
const DARK_TEXT = "#1f2937";
const MID_TEXT  = "#4b5563";
const LABEL_CLR = "#9ca3af";
const LIGHT_BDR = "#f0f0f0";
const PAY_BG    = "#f5f7fa";
const WHITE     = "#ffffff";

// A4 dimensions
const PW = 595.28;
const PH = 841.89;

// Font paths
const F = (n: string) => path.join(process.cwd(), "public", "fonts", n);
const CINZEL     = F("Cinzel-Regular.ttf");
const CINZEL_B   = F("Cinzel-Bold.ttf");
const LOGO_PATH  = path.join(process.cwd(), "public", "img", "logo", "gaurav-dot-one-transparent-gray.webp");

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}
function fmtNum(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2); }

async function getLogoPng(): Promise<Buffer | null> {
  try {
    if (!fs.existsSync(LOGO_PATH)) return null;
    return await sharp(LOGO_PATH).png().toBuffer();
  } catch { return null; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const logoPng = await getLogoPng();
  const hasCinzel = fs.existsSync(CINZEL) && fs.existsSync(CINZEL_B);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (hasCinzel) {
      doc.registerFont("Cinzel",  CINZEL);
      doc.registerFont("CinzelB", CINZEL_B);
    }
    const C  = hasCinzel ? "Cinzel"  : "Helvetica";
    const CB = hasCinzel ? "CinzelB" : "Helvetica-Bold";

    // ─── HEADER ──────────────────────────────────────────────────────────────
    // gradient: left block + right darker overlay
    const HDR_H  = 115;  // extra height gives bottom padding below address text
    const H_PAD  = 32;
    const H_VPAD = 22;

    doc.rect(0, 0, PW, HDR_H).fill(PURPLE);
    // slight darkening toward right to simulate the gradient
    doc.rect(PW * 0.55, 0, PW * 0.45, HDR_H).fillOpacity(0.30).fill(PURPLE2).fillOpacity(1);

    // Logo circle — white bordered circle, vertically centered in header
    const LOGO_D  = 50;
    const LOGO_CX = H_PAD + LOGO_D / 2;
    const LOGO_CY = HDR_H / 2;
    const LOGO_Y  = LOGO_CY - LOGO_D / 2;

    // White border circle
    doc.circle(LOGO_CX, LOGO_CY, LOGO_D / 2 + 2).fillOpacity(0.45).fill(WHITE).fillOpacity(1);

    if (logoPng) {
      doc.image(logoPng, H_PAD, LOGO_Y, { width: LOGO_D, height: LOGO_D });
    } else {
      doc.circle(LOGO_CX, LOGO_CY, LOGO_D / 2).fill(WHITE);
      doc.font(CB).fontSize(22).fill(PURPLE).text("G", LOGO_CX - 8, LOGO_CY - 13);
    }

    // Company name — Cinzel Bold, white, next to logo
    const NAME_X  = H_PAD + LOGO_D + 12;
    const NAME_W  = PW * 0.58 - NAME_X; // extend to 58% so long address lines don't wrap
    doc.font(CB).fontSize(13).fill(WHITE).fillOpacity(1);

    // Split name at natural break if long
    const coName  = data.company.name;
    const nameLines = coName.length > 30
      ? coName.match(/.{1,30}(\s|$)/g) ?? [coName]
      : [coName];

    let ny = H_VPAD + 4;
    for (const line of nameLines) {
      doc.text(line.trim(), NAME_X, ny, { width: NAME_W, lineGap: 0 });
      ny += 16;
    }

    // Company details: address + email + gst
    const details: string[] = [
      ...data.company.address.split("\n").filter(Boolean),
      ...(data.company.email ? [`Email: ${data.company.email}${data.company.gstNumber ? `  |  GST: ${data.company.gstNumber}` : ""}`] : [
        ...(data.company.gstNumber ? [`GST: ${data.company.gstNumber}`] : []),
      ]),
    ];
    doc.font("Helvetica").fontSize(8).fillOpacity(0.88).fill(WHITE);
    let dy = ny + 2;
    for (const line of details) {
      const lineH = doc.heightOfString(line, { width: NAME_W, lineGap: 1 });
      doc.text(line, NAME_X, dy, { width: NAME_W, lineGap: 1 });
      dy += lineH + 1;
    }
    doc.fillOpacity(1);

    // Invoice title block — right side of header
    const TITLE_X = PW * 0.62;
    const TITLE_W = PW - TITLE_X - H_PAD;

    // "INVOICE" small label
    doc.font(C).fontSize(8).fill(WHITE).fillOpacity(0.75)
      .text("I N V O I C E", TITLE_X, H_VPAD + 4, { width: TITLE_W, align: "right", characterSpacing: 4 });
    doc.fillOpacity(1);

    // Invoice number
    doc.font(CB).fontSize(20).fill(WHITE)
      .text(data.invoiceNumber, TITLE_X, H_VPAD + 18, { width: TITLE_W, align: "right" });

    // Date
    doc.font("Helvetica").fontSize(9.5).fillOpacity(0.9).fill(WHITE)
      .text(`Date: ${data.invoiceDate}`, TITLE_X, H_VPAD + 44, { width: TITLE_W, align: "right" });
    doc.fillOpacity(1);

    // ─── BODY ────────────────────────────────────────────────────────────────
    const B_PAD = 32;   // horizontal padding
    const B_W   = PW - B_PAD * 2;
    let y = HDR_H + 26;

    // ── Bill To section ───────────────────────────────────────────────────────
    const BT_W   = B_W * 0.52;   // left ~52% for client
    const META_X = B_PAD + BT_W + 16;
    const META_W = B_W - BT_W - 16;

    // "BILL TO" label
    doc.font("Helvetica-Bold").fontSize(8).fill(LABEL_CLR)
      .text("BILL TO", B_PAD, y, { characterSpacing: 1.5 });

    // Client name in Cinzel
    doc.font(CB).fontSize(17).fill(DARK_TEXT)
      .text(data.clientName, B_PAD, y + 12, { width: BT_W, lineGap: 1 });

    const clientNameH = doc.heightOfString(data.clientName, { width: BT_W });
    let billY = y + 12 + clientNameH + 5;

    // Client address
    if (data.clientAddress) {
      doc.font("Helvetica").fontSize(10).fill(GREY_TEXT)
        .text(data.clientAddress, B_PAD, billY, { width: BT_W, lineGap: 2.5 });
      billY += doc.heightOfString(data.clientAddress, { width: BT_W, lineGap: 2.5 }) + 4;
    }

    // Invoice meta — right side of bill-to row
    const metaRows: [string, string][] = [
      ["Invoice Date:",   data.invoiceDate],
      ["Due Date:",       data.dueDate],
      ["Payment Terms:", data.paymentTerms],
    ];
    const LABEL_W = 90;
    const VALUE_X = META_X + LABEL_W + 10;
    const VALUE_W = META_W - LABEL_W - 10;

    let mY = y;
    for (const [lbl, val] of metaRows) {
      doc.font("Helvetica").fontSize(10).fill(LABEL_CLR).text(lbl, META_X, mY, { width: LABEL_W, align: "right" });
      doc.font("Helvetica-Bold").fontSize(10).fill(DARK_TEXT).text(val, VALUE_X, mY, { width: VALUE_W });
      mY += 16;
    }

    // Separator line
    const sectionBottom = Math.max(billY, mY) + 14;
    doc.moveTo(B_PAD, sectionBottom).lineTo(PW - B_PAD, sectionBottom)
      .lineWidth(1).strokeColor(LIGHT_BDR).stroke();
    y = sectionBottom + 20;

    // ── Work Table ────────────────────────────────────────────────────────────
    // Columns: Description 55%, Hours 15%, Amount 30%
    const TBL_W  = B_W;
    const COL_D  = TBL_W * 0.55;
    const COL_H  = TBL_W * 0.15;
    const COL_A  = TBL_W * 0.30;
    const DESC_X = B_PAD;
    const HRS_X  = B_PAD + COL_D;
    const AMT_X  = B_PAD + COL_D + COL_H;
    const TH_H   = 32;

    // Table header background
    doc.rect(B_PAD, y, TBL_W, TH_H).fill(GREY_BG);
    doc.moveTo(B_PAD, y + TH_H).lineTo(PW - B_PAD, y + TH_H).lineWidth(1.5).strokeColor(GREY_BDR).stroke();

    doc.font("Helvetica-Bold").fontSize(8).fill(LABEL_CLR).fillOpacity(1);
    const TH_Y = y + (TH_H - 8) / 2;
    doc.text("DESCRIPTION", DESC_X + 14, TH_Y, { characterSpacing: 1 });
    doc.text("HOURS",       HRS_X,        TH_Y, { width: COL_H, align: "center", characterSpacing: 1 });
    doc.text("AMOUNT",      AMT_X,        TH_Y, { width: COL_A - 14, align: "right", characterSpacing: 1 });
    y += TH_H;

    // Table rows
    for (const item of data.items) {
      const descLines = item.description.split("\n").filter(Boolean);
      const badgeH    = item.dateLabel ? 14 : 0;
      const textH     = doc.font("Helvetica").fontSize(10)
        .heightOfString(descLines.join("\n"), { width: COL_D - 28, lineGap: 3 });
      const rowH = Math.max(44, badgeH + textH + 20);

      // Row separator
      doc.moveTo(B_PAD, y + rowH).lineTo(PW - B_PAD, y + rowH)
        .lineWidth(0.5).strokeColor(LIGHT_BDR).stroke();

      let rowDescY = y + 12;

      // Date badge (pill)
      if (item.dateLabel) {
        const bw = doc.font("Helvetica-Bold").fontSize(8).widthOfString(item.dateLabel) + 16;
        doc.roundedRect(DESC_X + 14, y + 10, bw, 14, 7).fill(PURPLE);
        doc.font("Helvetica-Bold").fontSize(8).fill(WHITE)
          .text(item.dateLabel, DESC_X + 14, y + 13, { width: bw, align: "center" });
        rowDescY = y + 28;
      }

      // Description lines
      doc.font("Helvetica").fontSize(10).fill(MID_TEXT);
      for (const line of descLines) {
        doc.text(line, DESC_X + 14, rowDescY, { width: COL_D - 28, lineGap: 3 });
        rowDescY += doc.heightOfString(line, { width: COL_D - 28, lineGap: 3 }) + 2;
      }

      // Hours (centered)
      const numY = y + (rowH - 11) / 2;
      doc.font("Helvetica").fontSize(10).fill(MID_TEXT)
        .text(`${fmtNum(item.hours)} hr${item.hours !== 1 ? "s" : ""}`, HRS_X, numY, { width: COL_H, align: "center" });

      // Amount (right)
      doc.font("Helvetica-Bold").fontSize(10).fill(DARK_TEXT)
        .text(fmt(item.amount, data.currency), AMT_X, numY, { width: COL_A - 14, align: "right" });

      y += rowH;
    }

    // Total Hours row
    const totalHours = data.items.reduce((s, i) => s + i.hours, 0);
    doc.rect(B_PAD, y, TBL_W, 30).fill(GREY_BG);
    doc.moveTo(B_PAD, y + 30).lineTo(PW - B_PAD, y + 30).lineWidth(0.5).strokeColor(LIGHT_BDR).stroke();

    doc.font("Helvetica-Bold").fontSize(10).fill(GREY_TEXT)
      .text("Total Hours", DESC_X + 14, y + 10, { width: COL_D - 28, align: "right" });
    doc.font("Helvetica-Bold").fontSize(10).fill(PURPLE)
      .text(`${fmtNum(totalHours)} hr${totalHours !== 1 ? "s" : ""}`, HRS_X, y + 10, { width: COL_H, align: "center" });
    y += 38;

    // ── Summary Box ───────────────────────────────────────────────────────────
    const SUM_W  = 240;
    const SUM_X  = PW - B_PAD - SUM_W;
    const sumRows: [string, string][] = [
      [`Subtotal (${fmtNum(totalHours)} hrs @ ${fmt(data.items[0]?.rate ?? 0, data.currency)}/hr)`, fmt(data.subtotal, data.currency)],
    ];
    if (data.adjustment !== 0) {
      sumRows.push(["Adjustment", fmt(data.adjustment, data.currency)]);
    }
    if (data.gstEnabled && data.gstAmount != null) {
      sumRows.push([`GST (${data.gstRate}%)`, fmt(data.gstAmount, data.currency)]);
    }
    const SUM_ROWS_H = sumRows.length * 18 + 36; // rows + total row
    const SUM_H      = SUM_ROWS_H + 20;

    doc.roundedRect(SUM_X, y, SUM_W, SUM_H, 8).fill(GREY_BG);
    doc.roundedRect(SUM_X, y, SUM_W, SUM_H, 8).strokeColor(LIGHT_BDR).lineWidth(0.5).stroke();

    let sy = y + 14;
    for (const [lbl, val] of sumRows) {
      doc.font("Helvetica").fontSize(10).fill(GREY_TEXT).text(lbl, SUM_X + 16, sy, { width: SUM_W * 0.55 });
      doc.font("Helvetica").fontSize(10).fill(GREY_TEXT).text(val, SUM_X + 16, sy, { width: SUM_W - 32, align: "right" });
      sy += 18;
    }

    // Total row — border top + Cinzel "Total Due"
    doc.moveTo(SUM_X + 16, sy + 2).lineTo(SUM_X + SUM_W - 16, sy + 2)
      .strokeColor(PURPLE).lineWidth(1.5).stroke();
    sy += 10;
    doc.font(C).fontSize(13).fill(PURPLE).text("Total Due", SUM_X + 16, sy, { width: SUM_W * 0.5 });
    doc.font(CB).fontSize(16).fill(PURPLE)
      .text(`${fmt(data.total, data.currency)} ${data.currency}`, SUM_X + 16, sy - 2, { width: SUM_W - 32, align: "right" });

    y += SUM_H + 28;

    // ── Payment Information ───────────────────────────────────────────────────
    const payFields: [string, string][] = [
      ["Account Name",   data.paymentInfo?.accountName ?? ""],
      ["Bank Name",      data.paymentInfo?.bankName ?? ""],
      ["Account Number", data.paymentInfo?.accountNumber ?? ""],
      ["IFSC Code",      data.paymentInfo?.ifscCode ?? ""],
      ["SWIFT Code",     data.paymentInfo?.swiftCode ?? ""],
      ["Branch",         data.paymentInfo?.branch ?? ""],
      ["UPI ID",         data.paymentInfo?.upiId ?? ""],
      ["PayPal / Other", data.paymentInfo?.paypalOther ?? ""],
    ].filter(([, v]) => v.trim() !== "") as [string, string][];

    if (payFields.length > 0) {
      // Two-column grid with box
      const COLS   = 2;
      const CELL_W = B_W / COLS;

      // Compute per-row heights based on actual value content (handles wrapped values)
      const rowHeights: number[] = [];
      for (let i = 0; i < payFields.length; i += COLS) {
        const rowH = Math.max(30, ...payFields.slice(i, i + COLS).map(([, val]) => {
          const valH = doc.font("Helvetica-Bold").fontSize(10).heightOfString(val, { width: CELL_W - 20 });
          return Math.ceil(9 + valH + 10); // label(9px) + value + bottom gap(10px)
        }));
        rowHeights.push(rowH);
      }
      const PAY_H = rowHeights.reduce((s, h) => s + h, 0) + 42;

      doc.roundedRect(B_PAD, y, B_W, PAY_H, 8).fill(PAY_BG);
      doc.roundedRect(B_PAD, y, B_W, PAY_H, 8).strokeColor(GREY_BDR).lineWidth(0.5).stroke();

      // "PAYMENT INFORMATION" title in Cinzel
      doc.font(C).fontSize(9).fill(PURPLE).fillOpacity(1)
        .text("P A Y M E N T   I N F O R M A T I O N", B_PAD + 16, y + 14, { characterSpacing: 1 });

      let pi = 0;
      let rowIdx = 0;
      let px = B_PAD + 16;
      let py = y + 30;
      for (const [lbl, val] of payFields) {
        doc.font("Helvetica").fontSize(8).fill(LABEL_CLR)
          .text(lbl.toUpperCase(), px, py, { characterSpacing: 0.4 });
        doc.font("Helvetica-Bold").fontSize(10).fill(DARK_TEXT)
          .text(val, px, py + 9, { width: CELL_W - 20 });
        pi++;
        if (pi % COLS === 0) {
          px = B_PAD + 16;
          py += rowHeights[rowIdx];
          rowIdx++;
        } else {
          px = B_PAD + CELL_W + 8;
        }
      }
      y += PAY_H + 24;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const FOOTER_Y = Math.max(y, PH - 80);
    doc.moveTo(B_PAD, FOOTER_Y).lineTo(PW - B_PAD, FOOTER_Y)
      .strokeColor(LIGHT_BDR).lineWidth(0.8).stroke();

    // "Thank you for your business!" in Cinzel, purple
    doc.font(CB).fontSize(15).fill(PURPLE)
      .text("Thank you for your business!", 0, FOOTER_Y + 16, { align: "center", width: PW });

    doc.font("Helvetica").fontSize(9).fill(LABEL_CLR)
      .text("This is a computer-generated invoice and does not require a signature.", 0, FOOTER_Y + 36, { align: "center", width: PW });

    const contact = [
      data.company.email ? `For queries, contact: ${data.company.email}` : "",
      data.company.phone ?? "",
    ].filter(Boolean).join("  |  ");
    if (contact) {
      doc.font("Helvetica").fontSize(8.5).fill(LABEL_CLR)
        .text(contact, 0, FOOTER_Y + 50, { align: "center", width: PW });
    }

    doc.end();
  });
}
