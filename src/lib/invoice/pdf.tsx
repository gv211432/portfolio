import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";

// Register fonts (Helvetica built-ins as fallback; custom fonts can be added later)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const PURPLE_START = "#667eea";
const PURPLE_END = "#764ba2";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#333",
    backgroundColor: "#fff",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: PURPLE_START,
    paddingHorizontal: 32,
    paddingVertical: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  companyName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  companyMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 8,
    marginTop: 2,
    textAlign: "right",
  },
  // ── Body ────────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  // ── Bill To + Meta row ──────────────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billToBlock: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  clientName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 3,
  },
  clientAddress: {
    fontSize: 8,
    color: "#555",
    lineHeight: 1.5,
  },
  metaBlock: {
    alignItems: "flex-end",
    minWidth: 150,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: PURPLE_START,
    marginBottom: 8,
  },
  metaGrid: {
    alignItems: "flex-end",
  },
  metaRow2: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaKey: {
    fontSize: 7,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    width: 70,
    textAlign: "right",
    marginRight: 8,
  },
  metaVal: {
    fontSize: 8,
    color: "#333",
    fontWeight: "bold",
  },
  // ── Work Table ──────────────────────────────────────────────────────────────
  table: {
    marginBottom: 20,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PURPLE_START,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colDesc: { flex: 1 },
  colHours: { width: 55, textAlign: "right" },
  colRate: { width: 55, textAlign: "right" },
  colAmount: { width: 65, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowAlt: {
    backgroundColor: "#fafaff",
  },
  dateBadge: {
    backgroundColor: PURPLE_START,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: "flex-start",
    marginBottom: 3,
  },
  dateBadgeText: {
    color: "#fff",
    fontSize: 6,
    fontWeight: "bold",
  },
  descriptionText: {
    fontSize: 8,
    color: "#333",
    lineHeight: 1.4,
  },
  cellNum: {
    fontSize: 8,
    color: "#333",
    textAlign: "right",
  },
  // ── Summary ─────────────────────────────────────────────────────────────────
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 6,
    padding: 16,
    minWidth: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.7)",
  },
  summaryValue: {
    fontSize: 8,
    color: "#fff",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 10,
    color: "#a78bfa",
    fontWeight: "bold",
  },
  // ── Payment Info ────────────────────────────────────────────────────────────
  paymentSection: {
    marginBottom: 20,
  },
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  paymentField: {
    width: "33.33%",
    marginBottom: 10,
    paddingRight: 8,
  },
  paymentLabel: {
    fontSize: 6,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 8,
    color: "#333",
    fontWeight: "bold",
  },
  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: PURPLE_END,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  footerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 7,
    marginTop: 2,
  },
  footerNote: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 7,
    textAlign: "right",
  },
  gstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
});

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
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

function InvoicePdf({ data }: { data: PdfInvoiceData }) {
  const totalHours = data.items.reduce((s, i) => s + i.hours, 0);

  const payFields: { label: string; value: string | null | undefined }[] = [
    { label: "Account Name", value: data.paymentInfo?.accountName },
    { label: "Bank Name", value: data.paymentInfo?.bankName },
    { label: "Account No.", value: data.paymentInfo?.accountNumber },
    { label: "IFSC Code", value: data.paymentInfo?.ifscCode },
    { label: "SWIFT Code", value: data.paymentInfo?.swiftCode },
    { label: "Branch", value: data.paymentInfo?.branch },
    { label: "UPI ID", value: data.paymentInfo?.upiId },
    { label: "PayPal / Other", value: data.paymentInfo?.paypalOther },
  ].filter((f) => f.value);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            {data.company.address.split("\n").map((line, i) => (
              <Text key={i} style={styles.companyMeta}>{line}</Text>
            ))}
            {data.company.email && <Text style={styles.companyMeta}>{data.company.email}</Text>}
            {data.company.gstNumber && <Text style={styles.companyMeta}>GST: {data.company.gstNumber}</Text>}
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Bill To + Meta */}
          <View style={styles.metaRow}>
            <View style={styles.billToBlock}>
              <Text style={styles.sectionLabel}>Bill To</Text>
              <Text style={styles.clientName}>{data.clientName}</Text>
              {data.clientAddress && (
                <Text style={styles.clientAddress}>{data.clientAddress}</Text>
              )}
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.invoiceTitle}>{data.invoiceNumber}</Text>
              <View style={styles.metaGrid}>
                {[
                  ["Invoice Date", data.invoiceDate],
                  ["Due Date", data.dueDate],
                  ["Payment Terms", data.paymentTerms],
                  ["Currency", data.currency],
                ].map(([k, v]) => (
                  <View key={k} style={styles.metaRow2}>
                    <Text style={styles.metaKey}>{k}</Text>
                    <Text style={styles.metaVal}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Line Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colHours]}>Hours</Text>
              <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
            </View>
            {data.items.map((item, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <View style={styles.colDesc}>
                  {item.dateLabel ? (
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{item.dateLabel}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
                <Text style={[styles.cellNum, styles.colHours]}>{fmtNum(item.hours)}</Text>
                <Text style={[styles.cellNum, styles.colRate]}>{fmt(item.rate, data.currency)}</Text>
                <Text style={[styles.cellNum, styles.colAmount]}>{fmt(item.amount, data.currency)}</Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Hours</Text>
                <Text style={styles.summaryValue}>{fmtNum(totalHours)} hrs</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{fmt(data.subtotal, data.currency)}</Text>
              </View>
              {data.adjustment !== 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Adjustment</Text>
                  <Text style={styles.summaryValue}>{fmt(data.adjustment, data.currency)}</Text>
                </View>
              )}
              {data.gstEnabled && data.gstAmount != null && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST ({data.gstRate}%)</Text>
                  <Text style={styles.summaryValue}>{fmt(data.gstAmount, data.currency)}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Due</Text>
                <Text style={styles.totalValue}>{fmt(data.total, data.currency)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Info */}
          {payFields.length > 0 && (
            <View style={styles.paymentSection}>
              <Text style={styles.sectionLabel}>Payment Information</Text>
              <View style={styles.paymentGrid}>
                {payFields.map((f) => (
                  <View key={f.label} style={styles.paymentField}>
                    <Text style={styles.paymentLabel}>{f.label}</Text>
                    <Text style={styles.paymentValue}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            {data.company.email && (
              <Text style={styles.footerSub}>{data.company.email}</Text>
            )}
          </View>
          <Text style={styles.footerNote}>
            This is a computer-generated invoice.{"\n"}
            Generated on {new Date().toLocaleDateString("en-IN")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoicePdf data={data} />);
}
