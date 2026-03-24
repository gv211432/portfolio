"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "./shared/StatusBadge";

type AppStatus = "PENDING" | "REVIEWED" | "INTERVIEWING" | "OFFERED" | "REJECTED" | "HIRED";

interface Application {
  id: string;
  jobSlug: string;
  jobTitle: string;
  legalName: string;
  passportNo: string;
  countryOfOrigin: string;
  experience: string;
  email: string;
  resumeUrl?: string;
  resumeFileName?: string;
  status: AppStatus;
  notes?: string;
  ipAddress?: string;
  ipInfo?: Record<string, string>;
  deviceInfo?: Record<string, string>;
  createdAt: string;
}

const STATUSES: AppStatus[] = ["PENDING", "REVIEWED", "INTERVIEWING", "OFFERED", "REJECTED", "HIRED"];

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

function DetailPanel({ app, onClose, onUpdate }: { app: Application; onClose: () => void; onUpdate: (updated: Application) => void }) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [status, setStatus] = useState<AppStatus>(app.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/careers/${app.id}`, {
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Application Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Full Name</p><p className="font-medium dark:text-white">{app.legalName}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="font-medium dark:text-white break-all">{app.email}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Position</p><p className="font-medium dark:text-white">{app.jobTitle}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Experience</p><p className="font-medium dark:text-white">{app.experience}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Country</p><p className="font-medium dark:text-white">{app.countryOfOrigin}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Passport No.</p><p className="font-medium dark:text-white font-mono text-xs">{app.passportNo}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Location</p><p className="font-medium dark:text-white">{loc}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Applied</p><p className="font-medium dark:text-white">{new Date(app.createdAt).toLocaleDateString()}</p></div>
          </div>

          {app.resumeUrl && (
            <a
              href={app.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {app.resumeFileName ?? "Download Resume"}
            </a>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppStatus)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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

export default function CareersSection() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
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
    const res = await fetch(`/api/admin/careers?${params}`);
    const data = await res.json();
    setApplications(data.applications ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteApp(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setTotal((t) => t - 1);
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      {selected && (
        <DetailPanel
          app={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setApplications((prev) => prev.map((a) => a.id === updated.id ? updated : a));
            setSelected(updated);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Career Applications</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{total.toLocaleString()} total applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search name, email, position…"
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
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
        ) : applications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Country</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {applications.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{a.legalName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 hidden md:table-cell">{a.jobTitle}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 hidden lg:table-cell">{a.countryOfOrigin}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} type="career" /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{timeAgo(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteApp(a.id)}
                        disabled={deleting === a.id}
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

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300">Prev</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
