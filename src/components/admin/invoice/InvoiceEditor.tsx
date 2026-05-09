"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { InvoiceFull, LineItem, PaymentProfile, InvoiceClient, CompanyProfile, CURRENCIES, fmtMoney } from "./types";

const InvoicePreview = dynamic(() => import("./InvoicePreview"), { ssr: false });

interface Props {
  invoiceId?: string; // undefined = create mode
  onSaved: (invoice: InvoiceFull) => void;
  onClose: () => void;
}

const EMPTY_ITEM = (): LineItem => ({
  dateLabel: "", description: "", hours: 0, rate: 0, amount: 0, sortOrder: 0,
});

const TODAY = new Date().toISOString().slice(0, 10);
const DUE_DATE = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

export default function InvoiceEditor({ invoiceId, onSaved, onClose }: Props) {
  // Form state
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(TODAY);
  const [dueDate, setDueDate] = useState(DUE_DATE);
  const [paymentTerms, setPaymentTerms] = useState("Net 15");
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM() }]);
  const [adjustment, setAdjustment] = useState(0);
  const [defaultRate, setDefaultRate] = useState(30);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [paymentProfileId, setPaymentProfileId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Meta
  const [loading, setLoading] = useState(!!invoiceId); // true while fetching existing invoice
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentProfile | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<InvoiceClient[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [status, setStatus] = useState<string>("DRAFT");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const clientRef = useRef<HTMLDivElement>(null);
  // Tracks whether invoice data has been loaded — prevents payment-profile default
  // from overwriting the profile already set by the loaded invoice.
  const invoiceLoadedRef = useRef(false);

  const isReadOnly = status === "SIGNED" || status === "VOID";

  // Load existing invoice data or fetch next invoice number for new invoices
  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      invoiceLoadedRef.current = false;
      fetch(`/api/admin/invoices/${invoiceId}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(({ invoice }) => {
          if (!invoice) throw new Error("Invoice not found");
          setClientId(invoice.clientId);
          setClientName(invoice.clientName);
          setClientAddress(invoice.clientAddress ?? "");
          setClientEmail(invoice.clientEmail ?? "");
          setInvoiceNumber(invoice.invoiceNumber);
          setInvoiceDate(invoice.invoiceDate.slice(0, 10));
          setDueDate(invoice.dueDate.slice(0, 10));
          setPaymentTerms(invoice.paymentTerms);
          setCurrency(invoice.currency);
          setItems(invoice.items.map((i: LineItem) => ({
            ...i,
            hours: Number(i.hours),
            rate: Number(i.rate),
            amount: Number(i.amount),
          })));
          setAdjustment(Number(invoice.adjustment));
          setGstEnabled(invoice.gstEnabled);
          if (invoice.gstRate) setGstRate(Number(invoice.gstRate));
          setPaymentProfileId(invoice.paymentProfileId ?? null);
          setNotes(invoice.notes ?? "");
          setStatus(invoice.status);
          if (invoice.pdfS3Key) setPdfUrl("has-pdf");
          invoiceLoadedRef.current = true;
        })
        .catch((err) => {
          setError(`Failed to load invoice: ${err.message}`);
        })
        .finally(() => setLoading(false));
    } else {
      invoiceLoadedRef.current = true;
      fetch("/api/admin/invoices/next-number")
        .then((r) => r.json())
        .then(({ invoiceNumber }) => setInvoiceNumber(invoiceNumber))
        .catch(() => {/* non-critical — user can edit the number */});
    }
  }, [invoiceId]);

  // Load payment profiles + company profile
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/invoice-payment-profiles").then((r) => r.json()),
      fetch("/api/admin/invoice-company-profile").then((r) => r.json()),
    ]).then(([pp, cp]) => {
      const profiles: PaymentProfile[] = pp.profiles ?? [];
      setPaymentProfiles(profiles);
      setCompany(cp.profile);
      // Only set default profile when creating a new invoice AND the invoice
      // data hasn't already set a profile (avoids stale-closure override).
      if (!invoiceId && !invoiceLoadedRef.current) {
        const def = profiles.find((p) => p.isDefault) ?? profiles[0];
        if (def) setPaymentProfileId(def.id);
      }
    }).catch(() => {/* non-critical */});
  }, [invoiceId]);

  // Update displayed payment info when profile changes
  useEffect(() => {
    const found = paymentProfiles.find((p) => p.id === paymentProfileId) ?? null;
    setPaymentInfo(found);
  }, [paymentProfileId, paymentProfiles]);

  // Client autocomplete
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) { setClientSuggestions([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/invoice-clients?autocomplete=true&search=${encodeURIComponent(clientSearch)}`);
      if (res.ok) { const d = await res.json(); setClientSuggestions(d.clients ?? []); }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Close client dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectClient(c: InvoiceClient) {
    setClientId(c.id);
    setClientName(c.name);
    setClientAddress(c.address ?? "");
    setClientEmail(c.email ?? "");
    setCurrency(c.defaultCurrency);
    setClientSearch("");
    setShowClientDropdown(false);
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { ...EMPTY_ITEM(), rate: defaultRate, sortOrder: prev.length },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i })));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: value };
        updated.amount = Number(updated.hours) * Number(updated.rate);
        return updated;
      })
    );
  }

  const subtotal = items.reduce((s, i) => s + Number(i.hours) * Number(i.rate), 0);
  const gstAmt = gstEnabled && gstRate ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + adjustment + gstAmt;

  async function save() {
    if (!clientName.trim()) { setError("Client name is required"); return; }
    if (items.length === 0) { setError("At least one item is required"); return; }
    setSaving(true); setError("");

    const body = {
      clientId, clientName, clientAddress, clientEmail,
      invoiceDate, dueDate, paymentTerms, currency,
      items: items.map((i) => ({ ...i, hours: Number(i.hours), rate: Number(i.rate) })),
      adjustment, gstEnabled, gstRate: gstEnabled ? gstRate : null,
      paymentProfileId, notes,
    };

    const url = invoiceId ? `/api/admin/invoices/${invoiceId}` : "/api/admin/invoices";
    const method = invoiceId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    onSaved(data.invoice);
  }

  async function generatePdf() {
    setGeneratingPdf(true); setError("");
    const saveRes = await fetch(invoiceId ? `/api/admin/invoices/${invoiceId}` : "/api/admin/invoices", {
      method: invoiceId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId, clientName, clientAddress, clientEmail,
        invoiceDate, dueDate, paymentTerms, currency,
        items: items.map((i) => ({ ...i, hours: Number(i.hours), rate: Number(i.rate) })),
        adjustment, gstEnabled, gstRate: gstEnabled ? gstRate : null,
        paymentProfileId, notes,
      }),
    });
    if (!saveRes.ok) { setError("Save failed"); setGeneratingPdf(false); return; }
    const saveData = await saveRes.json();
    const id = saveData.invoice.id;

    const pdfRes = await fetch(`/api/admin/invoices/${id}/pdf`, { method: "POST" });
    const pdfData = await pdfRes.json();
    setGeneratingPdf(false);
    if (!pdfRes.ok) { setError(pdfData.error ?? "PDF generation failed"); return; }
    setPdfUrl(pdfData.url);
    window.open(pdfData.url, "_blank");
    onSaved(pdfData.invoice);
  }

  async function downloadExisting() {
    if (!invoiceId || !pdfUrl) return;
    const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
  }

  const inputCls = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50`;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-900">
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">Loading invoice…</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-white">
          {invoiceId ? `Edit ${invoiceNumber}` : "New Invoice"}
        </span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${status === "DRAFT" ? "bg-slate-500" : status === "FINALIZED" ? "bg-blue-600" : "bg-green-600"}`}>
          {status}
        </span>

        {/* Mobile preview toggle */}
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="md:hidden ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs text-gray-600 dark:text-slate-300"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>

        <div className="ml-auto flex gap-2 flex-wrap">
          {!isReadOnly && (
            <button
              onClick={save}
              disabled={saving || generatingPdf}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          )}
          {pdfUrl && pdfUrl !== "has-pdf" && (
            <button
              onClick={downloadExisting}
              className="px-4 py-2 rounded-lg border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/30 transition"
            >
              Download PDF
            </button>
          )}
          {pdfUrl === "has-pdf" && (
            <button
              onClick={downloadExisting}
              className="px-4 py-2 rounded-lg border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/30 transition"
            >
              Download PDF
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={generatePdf}
              disabled={saving || generatingPdf}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {generatingPdf ? "Generating…" : "Generate PDF"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Form — always visible on desktop, toggled on mobile */}
        <div className={`w-full md:w-[45%] flex-shrink-0 overflow-y-auto p-4 space-y-5 ${showPreview ? "hidden md:block" : "block"}`}>
          {/* Client */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Client</h3>
            <div ref={clientRef} className="relative mb-2">
              <input
                placeholder="Search saved clients…"
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                onFocus={() => setShowClientDropdown(true)}
                className={inputCls}
                disabled={isReadOnly}
              />
              {showClientDropdown && clientSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                  {clientSuggestions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{c.name}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input placeholder="Client name *" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`${inputCls} mb-2`} disabled={isReadOnly} />
            <textarea placeholder="Address / details" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={3} className={`${inputCls} resize-none mb-2`} disabled={isReadOnly} />
            <input placeholder="Email (for sending)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" className={inputCls} disabled={isReadOnly} />
          </section>

          {/* Invoice Details */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Invoice #</label>
                <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputCls} disabled />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} disabled={isReadOnly}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Invoice Date</label>
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputCls} disabled={isReadOnly} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Payment Terms</label>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputCls} disabled={isReadOnly} />
              </div>
            </div>
          </section>

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Line Items</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Default rate</label>
                <input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex gap-2 mb-2">
                    <input
                      placeholder="Date label (e.g. May 1-5)"
                      value={item.dateLabel}
                      onChange={(e) => updateItem(idx, "dateLabel", e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      disabled={isReadOnly}
                    />
                    {!isReadOnly && items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1.5 rounded text-gray-400 hover:text-red-500 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none mb-2"
                    disabled={isReadOnly}
                  />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block mb-0.5">Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={item.hours}
                        onChange={(e) => updateItem(idx, "hours", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block mb-0.5">Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block mb-0.5">Amount</label>
                      <div className="px-2 py-1.5 rounded border border-gray-100 dark:border-slate-700 bg-gray-100 dark:bg-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {fmtMoney(item.hours * item.rate, currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!isReadOnly && (
              <button onClick={addItem} className="mt-2 w-full px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-xs text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition">
                + Add item
              </button>
            )}
          </section>

          {/* Summary */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subtotal</label>
                <div className="px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {fmtMoney(subtotal, currency)}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Adjustment</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </div>
            </div>
            {/* GST toggle */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setGstEnabled((v) => !v)}
                disabled={isReadOnly}
                className={`relative w-10 h-5 rounded-full transition ${gstEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${gstEnabled ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-xs text-gray-500">GST</span>
              {gstEnabled && (
                <>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={isReadOnly}
                  />
                  <span className="text-xs text-gray-400">%</span>
                </>
              )}
            </div>
            <div className="px-4 py-3 rounded-xl bg-indigo-950 text-white flex justify-between items-center">
              <span className="text-xs text-indigo-200">Total Due</span>
              <span className="text-base font-bold text-indigo-300">{fmtMoney(total, currency)}</span>
            </div>
          </section>

          {/* Payment Profile */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Payment Profile</h3>
            <select
              value={paymentProfileId ?? ""}
              onChange={(e) => setPaymentProfileId(e.target.value || null)}
              className={inputCls}
              disabled={isReadOnly}
            >
              <option value="">— None —</option>
              {paymentProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.label} ({p.currency})</option>
              ))}
            </select>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Internal Notes</h3>
            <textarea
              placeholder="Notes (not visible on invoice)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              disabled={isReadOnly}
            />
          </section>

          <div className="h-8" />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 dark:bg-slate-700" />

        {/* Preview */}
        <div className={`flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-slate-950 ${showPreview ? "block" : "hidden md:block"}`}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live Preview</p>
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            dueDate={dueDate}
            paymentTerms={paymentTerms}
            currency={currency}
            clientName={clientName}
            clientAddress={clientAddress}
            items={items}
            adjustment={adjustment}
            gstEnabled={gstEnabled}
            gstRate={gstRate}
            paymentInfo={paymentInfo ?? undefined}
            company={company ? { name: company.name, address: company.address, email: company.email, gstNumber: company.gstNumber } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
