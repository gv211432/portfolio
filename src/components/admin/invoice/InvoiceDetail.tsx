"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { InvoiceFull, InvoiceVersion, EmailLog, SignatureLog, STATUS_META, fmtMoney, fmtDate } from "./types";

interface Props {
  invoiceId: string;
  onEdit: () => void;
  onClose: () => void;
  onDeleted: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmailModal({ invoice, onClose, onSent }: {
  invoice: InvoiceFull; onClose: () => void; onSent: (log: EmailLog) => void;
}) {
  const [toEmail, setToEmail] = useState(invoice.clientEmail ?? "");
  const [toName, setToName]   = useState(invoice.clientName);
  const [subject, setSubject] = useState(`Invoice ${invoice.invoiceNumber}`);
  const [message, setMessage] = useState(
    `Please find your invoice ${invoice.invoiceNumber} attached.\n\nTotal due: ${fmtMoney(invoice.total, invoice.currency)}.\nPayment by: ${fmtDate(invoice.dueDate)}.\n\nThank you for your business!`
  );
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");

  async function send() {
    if (!toEmail.trim()) { setError("Recipient email is required"); return; }
    setSending(true); setError("");
    const res  = await fetch(`/api/admin/invoices/${invoice.id}/email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, toName, subject, message }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setError(data.error ?? "Send failed"); return; }
    onSent(data.emailLog);
  }

  const inp = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">Email Invoice</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">To Email *</label><input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className={inp} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">To Name</label><input value={toName} onChange={(e) => setToName(e.target.value)} className={inp} /></div>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inp} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Message</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className={`${inp} resize-none`} /></div>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            PDF attached automatically
          </p>
          <button onClick={send} disabled={sending} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
            {sending ? "Sending…" : "Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SignPanel({ invoiceId, invoiceStatus, hasPdf }: { invoiceId: string; invoiceStatus: string; hasPdf: boolean }) {
  const [signLog, setSignLog]   = useState<(SignatureLog & { status: string }) | null>(null);
  const [initiating, setInit]   = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/invoices/${invoiceId}/sign`);
    if (res.ok) { const d = await res.json(); setSignLog(d.status === "NOT_INITIATED" ? null : d); }
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (signLog?.status !== "SENT" && signLog?.status !== "INITIATED") return;
    const t = setInterval(load, 8000); return () => clearInterval(t);
  }, [signLog?.status, load]);

  async function initiate() {
    setInit(true); setError("");
    const res  = await fetch(`/api/admin/invoices/${invoiceId}/sign`, { method: "POST" });
    const data = await res.json();
    setInit(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setSignLog(data);
  }

  const STATUS_COLORS: Record<string, string> = {
    NOT_INITIATED: "text-gray-400", INITIATED: "text-yellow-500",
    SENT: "text-blue-500", SIGNED: "text-green-600", FAILED: "text-red-500",
  };
  const status = signLog?.status ?? "NOT_INITIATED";
  const canInit = hasPdf && !["DRAFT", "VOID", "SIGNED"].includes(invoiceStatus);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">eSign via Leegality</p>
        <span className={`text-xs font-semibold ${STATUS_COLORS[status] ?? "text-gray-400"}`}>
          {status.replace(/_/g, " ")}
        </span>
      </div>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {invoiceStatus === "SIGNED" ? (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Signed on {signLog?.completedAt ? fmtDate(signLog.completedAt) : "—"}
        </p>
      ) : (
        <div className="space-y-2">
          {signLog?.signingUrl && (
            <a href={signLog.signingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
              Open signing page
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
          <div className="flex gap-2">
            {canInit && (
              <button onClick={initiate} disabled={initiating}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50">
                {initiating ? "Initiating…" : signLog ? "Re-initiate eSign" : "Initiate eSign"}
              </button>
            )}
            {signLog && <button onClick={load} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition">↻</button>}
          </div>
          {!hasPdf && <p className="text-xs text-gray-400">Generate a PDF first.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Version Dropdown ─────────────────────────────────────────────────────────
// Uses fixed positioning calculated from the chevron button's bounding rect
// so the menu escapes sticky/overflow-hidden parent containers.
function VersionDropdown({ invoiceId, currentVersion, onDownloadMain }: {
  invoiceId: string; currentVersion: number; onDownloadMain: () => void;
}) {
  const [versions, setVersions]   = useState<InvoiceVersion[]>([]);
  const [open, setOpen]           = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [dlLoading, setDlLoading] = useState<number | null>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch(`/api/admin/invoices/${invoiceId}/versions`).then((r) => r.json())
      .then(({ versions }) => setVersions(versions ?? []));
  }, [invoiceId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (chevronRef.current && !chevronRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    if (!chevronRef.current) return;
    const r = chevronRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: r.bottom + 6,
      right: window.innerWidth - r.right,
      width: 260,
      zIndex: 9999,
    });
    setOpen((v) => !v);
  }

  async function download(version: number) {
    setDlLoading(version);
    const res = await fetch(`/api/admin/invoices/${invoiceId}/versions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version }),
    });
    if (res.ok) { const { url } = await res.json(); window.open(url, "_blank"); }
    setDlLoading(null);
    setOpen(false);
  }

  const hasHistory = versions.length > 1;

  return (
    <div className="flex">
      {/* Main download button */}
      <button
        onClick={onDownloadMain}
        className={`flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition ${hasHistory ? "rounded-l-lg" : "rounded-lg"}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        <span className="hidden sm:inline">Download</span>
        {currentVersion > 0 && <span className="text-green-200 text-xs ml-0.5">v{currentVersion}</span>}
      </button>

      {/* History chevron */}
      {hasHistory && (
        <button
          ref={chevronRef}
          onClick={toggle}
          className="px-2 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-r-lg border-l border-green-500 transition"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}

      {/* Dropdown rendered at fixed coords — escapes sticky header */}
      {open && (
        <div
          style={menuStyle}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">
            Version History
          </p>
          {versions.map((v) => {
            const isCurrent = v.version === currentVersion;
            return (
              <button key={v.version} onClick={() => download(v.version)}
                disabled={dlLoading === v.version}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition ${isCurrent ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-mono font-semibold shrink-0 ${isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`}>v{v.version}</span>
                  {isCurrent && <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">LATEST</span>}
                  <span className="text-xs text-gray-400 truncate">{fmtDate(v.generatedAt)}</span>
                </div>
                {dlLoading === v.version
                  ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  : <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Detail ──────────────────────────────────────────────────────────────
export default function InvoiceDetail({ invoiceId, onEdit, onClose, onDeleted }: Props) {
  const [invoice, setInvoice]       = useState<InvoiceFull | null>(null);
  const [loading, setLoading]       = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [locking, setLocking]       = useState(false);
  const [error, setError]           = useState("");
  const [showEmail, setShowEmail]   = useState(false);
  const [activeTab, setActiveTab]   = useState<"details" | "payment" | "history">("details");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoices/${invoiceId}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(({ invoice }) => { setInvoice(invoice); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [invoiceId]);

  async function downloadPdf() {
    if (!invoice?.pdfS3Key) return;
    setPdfLoading(true);
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
    if (res.ok) { const { url } = await res.json(); window.open(url, "_blank"); }
    setPdfLoading(false);
  }

  async function generatePdf() {
    setPdfLoading(true); setError("");
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      setError(d.error ?? "PDF generation failed"); setPdfLoading(false); return;
    }
    const data = await res.json();
    window.open(data.url, "_blank");
    setInvoice((p) => p ? { ...p, pdfS3Key: data.invoice.pdfS3Key, status: data.invoice.status, currentVersion: data.version } : p);
    setPdfLoading(false);
  }

  async function toggleLock(lock: boolean) {
    setLocking(true);
    const res  = await fetch(`/api/admin/invoices/${invoiceId}/lock`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock }),
    });
    const data = await res.json();
    setLocking(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setInvoice((p) => p ? { ...p, isLocked: lock } : p);
  }

  async function lockAndSend() {
    await toggleLock(true);
    if (!invoice?.pdfS3Key) await generatePdf();
    setShowEmail(true);
  }

  async function deleteInvoice() {
    if (!confirm(`Delete ${invoice?.invoiceNumber}? This is permanent.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/invoices/${invoiceId}`, { method: "DELETE" });
    if (res.ok) { onDeleted(); } else {
      const d = await res.json(); setError(d.error ?? "Delete failed"); setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!invoice) return <p className="p-8 text-gray-400">{error || "Invoice not found."}</p>;

  const meta       = STATUS_META[invoice.status];
  const total      = Number(invoice.total);
  const subtotal   = Number(invoice.subtotal);
  const adjustment = Number(invoice.adjustment);
  const isLocked   = invoice.isLocked;
  const canEdit    = !isLocked && invoice.status !== "SIGNED" && invoice.status !== "VOID";
  const canEmail   = invoice.status !== "DRAFT" && invoice.status !== "VOID";
  const hasPdf     = !!invoice.pdfS3Key;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
      {showEmail && (
        <EmailModal invoice={invoice} onClose={() => setShowEmail(false)}
          onSent={(log) => {
            setShowEmail(false);
            setInvoice((p) => p ? { ...p, emailLogs: [log, ...p.emailLogs], status: p.status === "FINALIZED" ? "SENT" : p.status } : p);
          }} />
      )}

      {/* ── Sticky Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20">
        {/* Top row: back + title + status */}
        <div className="px-4 py-3 flex items-center gap-2">
          <button onClick={onClose} className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base">{invoice.invoiceNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${meta.color}`}>{meta.label}</span>
              {isLocked && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Locked
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{invoice.clientName} · {fmtDate(invoice.invoiceDate)}</p>
          </div>
          {/* Total on header (visible on mobile) */}
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-gray-900 dark:text-white">{fmtMoney(total, invoice.currency)}</p>
            <p className="text-xs text-gray-400">Total Due</p>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-4 pb-3 flex flex-wrap gap-2 items-center">
          {/* Primary: PDF actions */}
          {!hasPdf ? (
            <button onClick={generatePdf} disabled={pdfLoading || invoice.status === "VOID"}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50">
              {pdfLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              Generate PDF
            </button>
          ) : (
            <VersionDropdown
              invoiceId={invoiceId}
              currentVersion={invoice.currentVersion ?? 0}
              onDownloadMain={downloadPdf}
            />
          )}

          {/* Edit button — visible for any non-signed, non-void, non-locked invoice */}
          {canEdit && (
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}

          {/* Regenerate (when PDF exists and editable) */}
          {hasPdf && canEdit && (
            <button onClick={generatePdf} disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {pdfLoading ? "…" : "Regenerate"}
            </button>
          )}

          {/* Lock / Unlock */}
          {invoice.status !== "SIGNED" && invoice.status !== "VOID" && (
            <button onClick={() => toggleLock(!isLocked)} disabled={locking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition disabled:opacity-50 ${isLocked ? "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                {isLocked
                  ? <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  : <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />}
              </svg>
              {locking ? "…" : isLocked ? "Unlock" : "Lock"}
            </button>
          )}

          {/* Lock & Send */}
          {!isLocked && canEmail && hasPdf && (
            <button onClick={lockAndSend}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              <span className="hidden sm:inline">Lock &amp; Send</span>
              <span className="sm:hidden">Send</span>
            </button>
          )}

          {/* Email (standalone) */}
          {canEmail && (
            <button onClick={() => setShowEmail(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="hidden sm:inline">Email</span>
            </button>
          )}

          {/* Delete (DRAFT only) */}
          {invoice.status === "DRAFT" && !isLocked && (
            <button onClick={deleteInvoice} disabled={deleting}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>

        {/* Mobile tab nav */}
        <div className="flex border-t border-gray-100 dark:border-slate-800 sm:hidden">
          {(["details", "payment", "history"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition ${activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">

          {/* Details tab / always visible on desktop */}
          <div className={activeTab === "details" || undefined ? "sm:block" : "hidden sm:block"}>
            {/* Client + Meta cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                <p className="font-semibold text-gray-900 dark:text-white">{invoice.clientName}</p>
                {invoice.clientEmail && <p className="text-sm text-gray-500 mt-0.5">{invoice.clientEmail}</p>}
                {invoice.clientAddress && <p className="text-xs text-gray-400 mt-2 whitespace-pre-line">{invoice.clientAddress}</p>}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Info</p>
                {[["Date", fmtDate(invoice.invoiceDate)], ["Due", fmtDate(invoice.dueDate)], ["Terms", invoice.paymentTerms], ["Currency", invoice.currency]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500 dark:text-slate-400">{k}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line items — horizontal scroll on mobile */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}>
                      {["Description", "Hours", "Rate", "Amount"].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-[10px] font-bold text-white uppercase tracking-wider ${i > 0 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id ?? idx} className={idx % 2 === 1 ? "bg-gray-50/50 dark:bg-slate-800/30" : ""}>
                        <td className="px-4 py-3">
                          {item.dateLabel && <span className="inline-block text-white text-[9px] font-bold rounded px-1.5 py-0.5 mb-1" style={{ background: "#667eea" }}>{item.dateLabel}</span>}
                          <p className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-line">{item.description}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 text-right whitespace-nowrap">{Number(item.hours)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 text-right whitespace-nowrap">{fmtMoney(item.rate, invoice.currency)}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-white text-right whitespace-nowrap">{fmtMoney(item.amount, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-4">
              <div className="bg-slate-900 rounded-xl p-4 min-w-[200px] space-y-2 w-full sm:w-auto">
                {[
                  ["Subtotal", fmtMoney(subtotal, invoice.currency)],
                  ...(adjustment !== 0 ? [["Adjustment", fmtMoney(adjustment, invoice.currency)]] : []),
                  ...(invoice.gstEnabled && invoice.gstAmount ? [[`GST (${invoice.gstRate}%)`, fmtMoney(invoice.gstAmount, invoice.currency)]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-400">{k}</span><span className="text-white">{v}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-indigo-400 text-base">{fmtMoney(total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment tab */}
          <div className={`${activeTab === "payment" ? "block" : "hidden sm:block"} mb-4`}>
            {invoice.paymentInfoSnapshot && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Information</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(invoice.paymentInfoSnapshot).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white break-all">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4">
              <SignPanel invoiceId={invoiceId} invoiceStatus={invoice.status} hasPdf={hasPdf} />
            </div>
          </div>

          {/* History tab */}
          <div className={`${activeTab === "history" ? "block" : "hidden sm:block"} space-y-4 mb-4`}>
            {/* Email history */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Email History</p>
              {invoice.emailLogs.length === 0 ? (
                <p className="text-sm text-gray-400">{canEmail ? "No emails sent yet." : "Generate a PDF first."}</p>
              ) : (
                <div className="space-y-2">
                  {invoice.emailLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-3 py-1.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.toEmail}</p>
                        <p className="text-xs text-gray-400 truncate">{log.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-medium ${log.status === "SENT" ? "text-green-600" : log.status === "FAILED" ? "text-red-500" : "text-yellow-500"}`}>{log.status}</span>
                        {log.sentAt && <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(log.sentAt)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Internal Notes</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 text-center py-2">
              Created {fmtDate(invoice.createdAt)} · Updated {fmtDate(invoice.updatedAt)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
