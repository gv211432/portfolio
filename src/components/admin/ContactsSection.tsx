"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "./shared/StatusBadge";

type ContactStatus = "NEW" | "CONTACTED" | "IN_DISCUSSION" | "PROPOSAL_SENT" | "CONVERTED" | "CLOSED";

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  budget: string;
  message: string;
  status: ContactStatus;
  notes?: string;
  ipAddress?: string;
  ipInfo?: Record<string, string>;
  deviceInfo?: Record<string, string>;
  createdAt: string;
}

const STATUSES: ContactStatus[] = ["NEW", "CONTACTED", "IN_DISCUSSION", "PROPOSAL_SENT", "CONVERTED", "CLOSED"];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function DetailPanel({ contact, onClose, onUpdate }: { contact: Submission; onClose: () => void; onUpdate: (updated: Submission) => void }) {
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [status, setStatus] = useState<ContactStatus>(contact.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) {
      const { submission } = await res.json();
      onUpdate(submission);
    }
    setSaving(false);
  }

  const loc = contact.ipInfo
    ? [contact.ipInfo.city, contact.ipInfo.region, contact.ipInfo.country].filter(Boolean).join(", ")
    : contact.ipAddress ?? "—";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">Contact Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Name</p><p className="font-medium dark:text-white">{contact.name}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="font-medium dark:text-white break-all">{contact.email}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="font-medium dark:text-white">{contact.phone ?? "—"}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Budget</p><p className="font-medium dark:text-white">{contact.budget}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Location</p><p className="font-medium dark:text-white">{loc}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Received</p><p className="font-medium dark:text-white">{new Date(contact.createdAt).toLocaleDateString()}</p></div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Message</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 whitespace-pre-wrap">{contact.message}</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Add notes…"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsSection() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      sortOrder,
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    const res = await fetch(`/api/admin/contacts?${params}`);
    const data = await res.json();
    setSubmissions(data.submissions ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setTotal((t) => t - 1);
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      {selected && (
        <DetailPanel
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setSubmissions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
            setSelected(updated);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contacts</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{total.toLocaleString()} total submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search name, email, message…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No contacts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Received</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 hidden md:table-cell">{s.budget}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} type="contact" /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{timeAgo(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteContact(s.id)}
                        disabled={deleting === s.id}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
