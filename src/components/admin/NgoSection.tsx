"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "./shared/StatusBadge";
import { useUrlState } from "@/hooks/useUrlState";

type NgoStatus = "PENDING" | "REVIEWING" | "APPROVED" | "IN_DEVELOPMENT" | "COMPLETED" | "REJECTED";

interface NgoApplication {
  id: string;
  organizationName: string;
  email: string;
  phone?: string;
  subdomain: string;
  description: string;
  impact: string;
  agreedToTerms: boolean;
  status: NgoStatus;
  notes?: string;
  ipAddress?: string;
  ipInfo?: Record<string, string>;
  deviceInfo?: Record<string, string>;
  createdAt: string;
}

const STATUSES: NgoStatus[] = ["PENDING", "REVIEWING", "APPROVED", "IN_DEVELOPMENT", "COMPLETED", "REJECTED"];

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

function DetailPanel({
  app,
  onClose,
  onUpdate,
}: {
  app: NgoApplication;
  onClose: () => void;
  onUpdate: (updated: NgoApplication) => void;
}) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [status, setStatus] = useState<NgoStatus>(app.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/ngo/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    if (res.ok) {
      const { application } = await res.json();
      onUpdate(application);
    }
    setSaving(false);
  }

  const loc = app.ipInfo
    ? [app.ipInfo.city, app.ipInfo.region, app.ipInfo.country].filter(Boolean).join(", ")
    : app.ipAddress ?? "—";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">NGO Application</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Organization</p><p className="font-medium text-gray-900 dark:text-white">{app.organizationName}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Subdomain</p><p className="font-medium text-gray-900 dark:text-white">{app.subdomain}.myorg.in</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="font-medium text-gray-900 dark:text-white break-all">{app.email}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="font-medium text-gray-900 dark:text-white">{app.phone ?? "—"}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Location</p><p className="font-medium text-gray-900 dark:text-white">{loc}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Received</p><p className="font-medium text-gray-900 dark:text-white">{new Date(app.createdAt).toLocaleDateString()}</p></div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Project Description</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{app.description}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1.5">Impact Statement</p>
            <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{app.impact}</p>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NgoStatus)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
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

export default function NgoSection() {
  const [urlState, setUrlState] = useUrlState({
    search: "", status: "", sort: "desc", page: "1", id: "",
  });

  const search = urlState.search;
  const statusFilter = urlState.status;
  const sortOrder = urlState.sort as "asc" | "desc";
  const page = Math.max(1, parseInt(urlState.page) || 1);
  const openId = urlState.id;

  const [applications, setApplications] = useState<NgoApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NgoApplication | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sortOrder,
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
    });
    const res = await fetch(`/api/admin/ngo?${params}`);
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, sortOrder, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  // Reopen detail panel from URL
  useEffect(() => {
    if (openId && applications.length > 0) {
      const found = applications.find((a) => a.id === openId);
      if (found) setSelected(found);
    }
  }, [openId, applications]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/ngo/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setTotal((t) => t - 1);
    if (selected?.id === id) setSelected(null);
    setDeleting(null);
  }

  function openDetail(app: NgoApplication) {
    setSelected(app);
    setUrlState({ id: app.id });
  }

  function closeDetail() {
    setSelected(null);
    setUrlState({ id: "" });
  }

  const statusColors: Record<NgoStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    REVIEWING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    IN_DEVELOPMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      {selected && (
        <DetailPanel
          app={selected}
          onClose={closeDetail}
          onUpdate={(updated) => {
            setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelected(updated);
          }}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search org, email, subdomain…"
          value={search}
          onChange={(e) => setUrlState({ search: e.target.value, page: "1" })}
          className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setUrlState({ status: e.target.value, page: "1" })}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button
          onClick={() => setUrlState({ sort: sortOrder === "desc" ? "asc" : "desc" })}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:border-indigo-400 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {sortOrder === "desc" ? "Newest" : "Oldest"}
        </button>
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-400 dark:text-slate-500">{total} application{total !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-sm">No NGO applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Organization</th>
                  <th className="px-4 py-3 text-left font-medium">Subdomain</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Received</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                    onClick={() => openDetail(app)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{app.organizationName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{app.subdomain}.myorg.in</code>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 dark:text-slate-400 truncate max-w-[180px]">{app.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400 dark:text-slate-500 text-xs whitespace-nowrap">{timeAgo(app.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deleting === app.id}
                        className="p-1.5 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
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
        <div className="flex items-center justify-between">
          <button
            onClick={() => setUrlState({ page: String(page - 1) })}
            disabled={page <= 1}
            className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:border-indigo-400 disabled:opacity-40 transition"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400 dark:text-slate-500">Page {page} of {pages}</span>
          <button
            onClick={() => setUrlState({ page: String(page + 1) })}
            disabled={page >= pages}
            className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:border-indigo-400 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
