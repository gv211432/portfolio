"use client";

import { LineItem, PaymentInfo, fmtMoney } from "./types";

interface Company {
  name: string;
  address: string;
  email?: string | null;
  gstNumber?: string | null;
}

interface Props {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  clientName: string;
  clientAddress?: string;
  items: LineItem[];
  adjustment: number;
  gstEnabled: boolean;
  gstRate?: number;
  paymentInfo?: PaymentInfo;
  company?: Company;
}

function fmt(amount: number, currency: string) {
  return fmtMoney(amount, currency);
}

export default function InvoicePreview(props: Props) {
  const {
    invoiceNumber, invoiceDate, dueDate, paymentTerms, currency,
    clientName, clientAddress, items, adjustment, gstEnabled, gstRate,
    paymentInfo, company,
  } = props;

  const subtotal = items.reduce((s, i) => s + i.hours * i.rate, 0);
  const totalHours = items.reduce((s, i) => s + i.hours, 0);
  const gstAmt = gstEnabled && gstRate ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + adjustment + gstAmt;

  const payFields: { label: string; value: string | null | undefined }[] = [
    { label: "Account Name", value: paymentInfo?.accountName },
    { label: "Bank", value: paymentInfo?.bankName },
    { label: "Account No.", value: paymentInfo?.accountNumber },
    { label: "IFSC", value: paymentInfo?.ifscCode },
    { label: "SWIFT", value: paymentInfo?.swiftCode },
    { label: "Branch", value: paymentInfo?.branch },
    { label: "UPI ID", value: paymentInfo?.upiId },
    { label: "PayPal / Other", value: paymentInfo?.paypalOther },
  ].filter((f) => f.value);

  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return iso; }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden text-[13px] font-[system-ui,sans-serif]"
      style={{ minHeight: 800, fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div
        className="px-8 py-7 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xl"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          G
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-base tracking-wide">
            {company?.name || "Gaurav Dot One"}
          </p>
          {company?.address?.split("\n").map((line, i) => (
            <p key={i} className="text-white/80 text-xs mt-0.5">{line}</p>
          ))}
          {company?.email && <p className="text-white/80 text-xs">{company.email}</p>}
          {company?.gstNumber && <p className="text-white/70 text-xs">GST: {company.gstNumber}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        {/* Bill To + Meta */}
        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bill To</p>
            <p className="text-lg font-bold text-gray-900">{clientName || "Client Name"}</p>
            {clientAddress && (
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{clientAddress}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold mb-2" style={{ color: "#667eea" }}>
              {invoiceNumber || "INV-XX-XX-000"}
            </p>
            {[
              ["Invoice Date", fmtDate(invoiceDate)],
              ["Due Date", fmtDate(dueDate)],
              ["Payment Terms", paymentTerms],
              ["Currency", currency],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-end gap-3 mb-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{k}</span>
                <span className="text-xs font-semibold text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-lg overflow-hidden mb-6 border border-gray-100">
          <div
            className="grid grid-cols-[1fr_80px_80px_90px] px-4 py-2.5"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
          >
            {["Description", "Hours", "Rate", "Amount"].map((h) => (
              <p key={h} className="text-[10px] font-bold text-white uppercase tracking-wider text-right first:text-left">{h}</p>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-300">No items yet</p>
          ) : items.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className={`grid grid-cols-[1fr_80px_80px_90px] px-4 py-3 border-b border-gray-50 ${idx % 2 === 1 ? "bg-indigo-50/30" : ""}`}
            >
              <div>
                {item.dateLabel && (
                  <span
                    className="inline-block text-white text-[9px] font-bold rounded px-1.5 py-0.5 mb-1"
                    style={{ background: "#667eea" }}
                  >
                    {item.dateLabel}
                  </span>
                )}
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{item.description || "—"}</p>
              </div>
              <p className="text-xs text-gray-600 text-right pt-0.5">{item.hours}</p>
              <p className="text-xs text-gray-600 text-right pt-0.5">{fmt(item.rate, currency)}</p>
              <p className="text-xs font-semibold text-gray-800 text-right pt-0.5">{fmt(item.hours * item.rate, currency)}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div
            className="rounded-xl p-5 min-w-[220px]"
            style={{ background: "#1a1a2e" }}
          >
            {[
              ["Total Hours", `${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(2)} hrs`],
              ["Subtotal", fmt(subtotal, currency)],
              ...(adjustment !== 0 ? [["Adjustment", fmt(adjustment, currency)]] : []),
              ...(gstEnabled && gstRate ? [[`GST (${gstRate}%)`, fmt(gstAmt, currency)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between mb-2">
                <span className="text-xs text-white/60">{k}</span>
                <span className="text-xs text-white">{v}</span>
              </div>
            ))}
            <div className="border-t border-white/20 mt-2 pt-3 flex justify-between">
              <span className="text-sm font-bold text-white">Total Due</span>
              <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>{fmt(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {payFields.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Information</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {payFields.map((f) => (
                <div key={f.label}>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                  <p className="text-xs font-semibold text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-8 py-4 flex items-center justify-between"
        style={{ background: "#764ba2" }}
      >
        <div>
          <p className="text-white font-bold text-sm">Thank you for your business!</p>
          {company?.email && <p className="text-white/70 text-xs mt-0.5">{company.email}</p>}
        </div>
        <p className="text-white/60 text-[10px] text-right">
          Computer-generated invoice.<br />
          Generated on {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>
    </div>
  );
}
