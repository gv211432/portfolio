"use client";

import { useState, useEffect, useCallback } from "react";
import { InvoiceFull, EmailLog, SignatureLog, STATUS_META, fmtMoney, fmtDate } from "./types";

interface Props {
  invoiceId: string;
  onEdit: () => void;
  onClose: () => void;
  onDeleted: () => void;
}

// ─── Email Modal ──────────────────────────────────────────────────────────────

function EmailModal({
  invoice,
  onClose,
  onSent,
}: {
  invoice: InvoiceFull;
  onClose: () => void;
  onSent: (log: EmailLog) => void;
}) {
  const [toEmail, setToEmail] = useState(invoice.clientEmail ?? "");
  const [toName, setToName] = useState(invoice.clientName);
  const [subject, setSubject] = useState(`Invoice ${invoice.invoiceNumber}`);
  const [message, setMessage] = useState(
    `Please find your invoice ${invoice.invoiceNumber} attached.\n\nThe total amount due is ${fmtMoney(invoice.total, invoice.currency)}.\n\nPlease make payment by ${fmtDate(invoice.dueDate)} as per the payment terms.\n\nThank you for your business!`
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!toEmail.trim()) { setError("Recipient email is required"); return; }
    setSending(true); setError("");
    const res = await fetch(`/api/admin/invoices/${invoice.id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, toName, subject, message }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setError(data.error ?? "Send failed"); return; }
    onSent(data.emailLog);
  }

  const inp = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">Email Invoice</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-500 mb-1 block">To Email *</label>
              <input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className={inp} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-500 mb-1 block">To Name</label>
              <input value={toName} onChange={(e) => setToName(e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className={`${inp} resize-none`} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            PDF attached automatically
          </div>
          <button onClick={send} disabled={sending} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
            {sending ? "Sending…" : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sign Panel ───────────────────────────────────────────────────────────────

const SIGN_STATUS_META: Record<string, { label: string; color: string }> = {
  NOT_INITIATED:    { label: "Not Initiated",   color: "text-gray-400" },
  INITIATED:        { label: "Initiated",        color: "text-yellow-500" },
  SENT:             { label: "Sent to Signer",   color: "text-blue-500" },
  SIGNED:           { label: "Signed",           color: "text-green-600" },
  FAILED:           { label: "Failed",           color: "text-red-500" },
};

function SignPanel({ invoiceId, invoiceStatus, hasPdf }: {
  invoiceId: string;
  invoiceStatus: string;
  hasPdf: boolean;
}) {
  const [signLog, setSignLog] = useState<(SignatureLog & { status: string }) | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/sign`);
    if (res.ok) {
      const data = await res.json();
      setSignLog(data.status === "NOT_INITIATED" ? null : data);
    }
  }, [invoiceId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Auto-poll while pending
  useEffect(() => {
    if (signLog?.status !== "SENT" && signLog?.status !== "INITIATED") return;
    const t = setInterval(loadStatus, 8000);
    return () => clearInterval(t);
  }, [signLog?.status, loadStatus]);

  async function initiate() {
    setInitiating(true); setError("");
    const res = await fetch(`/api/admin/invoices/${invoiceId}/sign`, { method: "POST" });
    const data = await res.json();
    setInitiating(false);
    if (!res.ok) { setError(data.error ?? "Failed to initiate signing"); return; }
    setSignLog(data);
  }

  async function checkStatus() {
    setChecking(true);
    await loadStatus();
    setChecking(false);
  }

  const currentStatus = signLog?.status ?? "NOT_INITIATED";
  const meta = SIGN_STATUS_META[currentStatus] ?? SIGN_STATUS_META.NOT_INITIATED;
  const canInitiate = hasPdf && invoiceStatus !== "DRAFT" && invoiceStatus !== "VOID" && invoiceStatus !== "SIGNED";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">eSign via Leegality</p>
        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}

      {invoiceStatus === "SIGNED" ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Invoice signed on {signLog?.completedAt ? fmtDate(signLog.completedAt) : "—"}
        </div>
      ) : (
        <div className="space-y-3">
          {signLog?.signingUrl && (currentStatus === "SENT" || currentStatus === "INITIATED") && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Signing link ready</p>
              <a
                href={signLog.signingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open signing page
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <p className="text-xs text-blue-500">Auto-checking every 8s…</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {canInitiate && (
              <button
                onClick={initiate}
                disabled={initiating}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {initiating ? "Initiating…" : signLog ? "Re-initiate eSign" : "Initiate eSign"}
              </button>
            )}
            {signLog && (
              <button
                onClick={checkStatus}
                disabled={checking}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                {checking ? "…" : "Refresh"}
              </button>
            )}
          </div>

          {!hasPdf && (
            <p className="text-xs text-gray-400">Generate a PDF first to enable signing.</p>
          )}
          {invoiceStatus === "DRAFT" && (
            <p className="text-xs text-gray-400">Finalize the invoice before signing.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Detail Component ────────────────────────────────────────────────────

export default function InvoiceDetail({ invoiceId, onEdit, onClose, onDeleted }: Props) {
  const [invoice, setInvoice] = useState<InvoiceFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoices/${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ invoice }) => { setInvoice(invoice); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
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

  if (!invoice) return <p className="p-8 text-gray-400">{error || "Invoice not found."}</p>;

  const meta = STATUS_META[invoice.status];
  const subtotal = Number(invoice.subtotal);
  const adjustment = Number(invoice.adjustment);
  const total = Number(invoice.total);
  const canEmail = invoice.status !== "DRAFT" && invoice.status !== "VOID";
  const canSign = !!invoice.pdfS3Key && invoice.status !== "DRAFT" && invoice.status !== "VOID";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {showEmailModal && (
        <EmailModal
          invoice={invoice}
          onClose={() => setShowEmailModal(false)}
          onSent={(log) => {
            setShowEmailModal(false);
            setInvoice((prev) => prev
              ? { ...prev, emailLogs: [log, ...prev.emailLogs], status: prev.status === "FINALIZED" ? "SENT" : prev.status }
              : prev
            );
          }}
        />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{invoice.invoiceNumber}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${meta.color}`}>{meta.label}</span>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
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
          {canEmail && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
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

      <div className="p-4 space-y-5 max-w-3xl mx-auto w-full">
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

        {/* eSign */}
        <SignPanel invoiceId={invoiceId} invoiceStatus={invoice.status} hasPdf={!!invoice.pdfS3Key} />

        {/* Email history */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Email History</p>
          {invoice.emailLogs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {canEmail ? "No emails sent yet." : "Generate a PDF to enable emailing."}
            </p>
          ) : (
            <div className="space-y-2">
              {invoice.emailLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 text-sm py-1">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{log.toEmail}</p>
                    <p className="text-xs text-gray-400 truncate">{log.subject}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-medium ${log.status === "SENT" ? "text-green-600" : log.status === "FAILED" ? "text-red-500" : "text-yellow-500"}`}>
                      {log.status}
                    </span>
                    {log.sentAt && <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(log.sentAt)}</p>}
                  </div>
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
