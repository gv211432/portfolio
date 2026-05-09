"use client";

import { useState, useEffect, useCallback } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { InvoiceListItem, STATUS_META, CURRENCIES, fmtMoney, fmtDate } from "./types";

const STATUSES = ["DRAFT", "FINALIZED", "SENT", "PENDING_SIGNATURE", "SIGNED", "VOID"] as const;

interface Props {
  onOpen: (id: string) => void;
  onNew: () => void;
}

export default function InvoiceList({ onOpen, onNew }: Props) {
  const [params, setParams] = useUrlState({ invSearch: "", invStatus: "", invCurrency: "", invPage: "1" });
  const search = params.invSearch;
  const status = params.invStatus;
  const currency = params.invCurrency;
  const currentPage = Math.max(1, parseInt(params.invPage));

  function setSearch(v: string) { setParams({ invSearch: v }); }
  function setStatus(v: string) { setParams({ invStatus: v }); }
  function setCurrency(v: string) { setParams({ invCurrency: v }); }
  function setPage(v: string) { setParams({ invPage: v }); }
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("page", String(currentPage));
    sp.set("limit", String(limit));
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (currency) sp.set("currency", currency);

    const res = await fetch(`/api/admin/invoices?${sp}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
      setTotal(data.total);
    }
    setLoading(false);
  }, [search, status, currency, currentPage]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(inv: InvoiceListItem) {
    if (!inv.pdfS3Key) return;
    setPdfLoading(inv.id);
    const res = await fetch(`/api/admin/invoices/${inv.id}/pdf`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
    setPdfLoading(null);
  }

  async function handleVoid(inv: InvoiceListItem) {
    if (!confirm(`Void invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    await fetch(`/api/admin/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "VOID" }),
    });
    load();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage("1"); }}
          placeholder="Search invoices…"
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage("1"); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <select
          value={currency}
          onChange={(e) => { setCurrency(e.target.value); setPage("1"); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Currencies</option>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={onNew}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No invoices found</p>
            <button onClick={onNew} className="mt-3 text-indigo-500 text-sm hover:underline">
              Create your first invoice
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Invoice #</th>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Due</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const meta = STATUS_META[inv.status];
                  const isVoid = inv.status === "VOID";
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition ${isVoid ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onOpen(inv.id)}
                          className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{inv.clientName}</div>
                        {inv.clientEmail && <div className="text-xs text-gray-400">{inv.clientEmail}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{fmtDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {fmtMoney(inv.total, inv.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpen(inv.id)}
                            title="Open"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {inv.pdfS3Key && (
                            <button
                              onClick={() => handleDownload(inv)}
                              disabled={pdfLoading === inv.id}
                              title="Download PDF"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                            >
                              {pdfLoading === inv.id ? (
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              )}
                            </button>
                          )}
                          {!isVoid && inv.status !== "SIGNED" && (
                            <button
                              onClick={() => handleVoid(inv)}
                              title="Void"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
              {invoices.map((inv) => {
                const meta = STATUS_META[inv.status];
                return (
                  <button
                    key={inv.id}
                    onClick={() => onOpen(inv.id)}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{inv.invoiceNumber}</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-0.5">{inv.clientName}</p>
                        <p className="text-xs text-gray-400 mt-1">{fmtDate(inv.invoiceDate)} · Due {fmtDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900 dark:text-white">{fmtMoney(inv.total, inv.currency)}</p>
                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-slate-400">
            {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(String(currentPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Prev
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(String(currentPage + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
