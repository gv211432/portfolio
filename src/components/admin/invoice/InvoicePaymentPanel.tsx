"use client";

import { useState } from "react";
import { InvoicePayment, fmtMoney, fmtDate } from "./types";

interface Props {
  invoiceId: string;
  currency: string;
  total: number;
  paidAmount: number;
  payments: InvoicePayment[];
  readOnly?: boolean;
  onChanged: () => void;
}

export default function InvoicePaymentPanel({
  invoiceId, currency, total, paidAmount, payments, readOnly, onChanged,
}: Props) {
  const [amount, setAmount]   = useState("");
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const balance = total - paidAmount;
  const pct     = total > 0 ? Math.min((paidAmount / total) * 100, 100) : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFutureDate = date > todayStr;

  async function recordPayment() {
    if (!amount || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
    if (date > new Date().toISOString().slice(0, 10)) {
      setError("Payment date can't be in the future — check the month.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), paidDate: date, notes }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setAmount(""); setNotes("");
      onChanged();
    } finally { setSaving(false); }
  }

  async function removePayment(paymentId: string) {
    setDeleting(paymentId);
    try {
      await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      onChanged();
    } finally { setDeleting(null); }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5">
          <span>Collected {fmtMoney(paidAmount, currency)}</span>
          <span>of {fmtMoney(total, currency)}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className={pct >= 100 ? "text-emerald-500 font-semibold" : "text-orange-500 font-semibold"}>
            {pct >= 100 ? "Fully paid" : `Balance: ${fmtMoney(balance, currency)}`}
          </span>
          <span className="text-gray-400">{pct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Record payment form */}
      {!readOnly && pct < 100 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Record Payment</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Amount ({currency})</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder={balance.toFixed(2)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputCls} ${isFutureDate ? "border-amber-400 dark:border-amber-500 focus:ring-amber-500" : ""}`}
              />
              <p className={`mt-1 text-xs ${isFutureDate ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
                {isFutureDate
                  ? `⚠ ${fmtDate(date)} is in the future — check the month`
                  : fmtDate(date)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Wire transfer, Ref #12345"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setAmount(balance.toFixed(2))}
              className="px-3 py-1.5 text-xs rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
            >
              Full balance
            </button>
            <button
              onClick={recordPayment}
              disabled={saving}
              className="flex-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Payment History</p>
          {payments.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmtMoney(p.amount, currency)}</span>
                  <span className="text-xs text-gray-400 shrink-0">{fmtDate(p.paidDate)}</span>
                </div>
                {p.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{p.notes}</p>}
              </div>
              {!readOnly && (
                <button
                  onClick={() => removePayment(p.id)}
                  disabled={deleting === p.id}
                  className="p-1 rounded text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition disabled:opacity-40"
                  title="Remove payment"
                >
                  {deleting === p.id ? (
                    <span className="w-4 h-4 block border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">No payments recorded yet.</p>
      )}
    </div>
  );
}
