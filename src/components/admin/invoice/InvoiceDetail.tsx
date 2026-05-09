"use client";

import { useState, useEffect } from "react";
import { InvoiceFull, STATUS_META, fmtMoney, fmtDate } from "./types";

interface Props {
  invoiceId: string;
  onEdit: () => void;
  onClose: () => void;
  onDeleted: () => void;
}

export default function InvoiceDetail({ invoiceId, onEdit, onClose, onDeleted }: Props) {
  const [invoice, setInvoice] = useState<InvoiceFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoices/${invoiceId}`)
      .then((r) => r.json())
      .then(({ invoice }) => { setInvoice(invoice); setLoading(false); });
  }, [invoiceId]);

  async function downloadPdf() {
    if (!invoice?.pdfS3Key) return;
    setPdfLoading(true);
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
    setPdfLoading(false);
  }

  async function generatePdf() {
    setPdfLoading(true); setError("");
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, { method: "POST" });
    const data = await res.json();
    setPdfLoading(false);
    if (!res.ok) { setError(data.error ?? "PDF generation failed"); return; }
    window.open(data.url, "_blank");
    setInvoice((prev) => prev ? { ...prev, pdfS3Key: data.invoice.pdfS3Key, status: data.invoice.status } : prev);
  }

  async function deleteInvoice() {
    if (!confirm(`Delete invoice ${invoice?.invoiceNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, { method: "DELETE" });
    if (res.ok) { onDeleted(); } else {
      const d = await res.json();
      setError(d.error ?? "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) return <p className="p-8 text-gray-400">Invoice not found.</p>;

  const meta = STATUS_META[invoice.status];
  const subtotal = Number(invoice.subtotal);
  const adjustment = Number(invoice.adjustment);
  const total = Number(invoice.total);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{invoice.invoiceNumber}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${meta.color}`}>{meta.label}</span>

        <div className="ml-auto flex items-center gap-2">
          {invoice.status === "DRAFT" && (
            <>
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                Edit
              </button>
              <button
                onClick={deleteInvoice}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          )}
          {!invoice.pdfS3Key ? (
            <button
              onClick={generatePdf}
              disabled={pdfLoading || invoice.status === "SIGNED" || invoice.status === "VOID"}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {pdfLoading ? "Generating…" : "Generate PDF"}
            </button>
          ) : (
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Download PDF
            </button>
          )}
          {invoice.status === "FINALIZED" && (
            <button
              onClick={generatePdf}
              disabled={pdfLoading}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-4 space-y-6 max-w-3xl mx-auto w-full">
        {/* Client + Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.clientName}</p>
            {invoice.clientEmail && <p className="text-sm text-gray-500 mt-0.5">{invoice.clientEmail}</p>}
            {invoice.clientAddress && <p className="text-xs text-gray-400 mt-2 whitespace-pre-line">{invoice.clientAddress}</p>}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Info</p>
            {[
              ["Date", fmtDate(invoice.invoiceDate)],
              ["Due", fmtDate(invoice.dueDate)],
              ["Terms", invoice.paymentTerms],
              ["Currency", invoice.currency],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400">{k}</span>
                <span className="font-medium text-gray-900 dark:text-white">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div
            className="px-4 py-2.5 grid grid-cols-[1fr_70px_70px_80px] text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
          >
            {["Description", "Hours", "Rate", "Amount"].map((h) => (
              <p key={h} className="text-right first:text-left">{h}</p>
            ))}
          </div>
          {invoice.items.map((item, idx) => (
            <div key={item.id ?? idx} className={`grid grid-cols-[1fr_70px_70px_80px] px-4 py-3 border-b border-gray-50 dark:border-slate-800 ${idx % 2 === 1 ? "bg-gray-50/50 dark:bg-slate-800/30" : ""}`}>
              <div>
                {item.dateLabel && (
                  <span className="inline-block text-white text-[9px] font-bold rounded px-1.5 py-0.5 mb-1" style={{ background: "#667eea" }}>
                    {item.dateLabel}
                  </span>
                )}
                <p className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-line">{item.description}</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 text-right">{Number(item.hours)}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 text-right">{fmtMoney(item.rate, invoice.currency)}</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-white text-right">{fmtMoney(item.amount, invoice.currency)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="rounded-xl bg-slate-900 p-5 min-w-[200px] space-y-2">
            {[
              ["Subtotal", fmtMoney(subtotal, invoice.currency)],
              ...(adjustment !== 0 ? [["Adjustment", fmtMoney(adjustment, invoice.currency)]] : []),
              ...(invoice.gstEnabled && invoice.gstAmount ? [[`GST (${invoice.gstRate}%)`, fmtMoney(invoice.gstAmount, invoice.currency)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-indigo-400">{fmtMoney(total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paymentInfoSnapshot && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Information</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(invoice.paymentInfoSnapshot)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">{String(v)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Email log — Phase 2 placeholder */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Email History</p>
          {invoice.emailLogs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email sending available in next phase</span>
            </div>
          ) : (
            <div className="space-y-2">
              {invoice.emailLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-900 dark:text-white">{log.toEmail}</span>
                    <span className="text-gray-400 ml-2 text-xs">{log.subject}</span>
                  </div>
                  <span className={`text-xs font-medium ${log.status === "SENT" ? "text-green-600" : log.status === "FAILED" ? "text-red-600" : "text-yellow-600"}`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Internal Notes</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 text-center pb-4">
          Created {fmtDate(invoice.createdAt)} · Updated {fmtDate(invoice.updatedAt)}
        </div>
      </div>
    </div>
  );
}
