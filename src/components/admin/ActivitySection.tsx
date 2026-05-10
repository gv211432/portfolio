"use client";

import { useCallback, useEffect, useState } from "react";

interface Log {
  id: string;
  createdAt: string;
  actorType: "ADMIN" | "STAFF" | "SYSTEM";
  actorLabel: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
}

const LIMITS = [20, 50, 100] as const;

export default function ActivitySection() {
  const [logs, setLogs]         = useState<Log[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState<(typeof LIMITS)[number]>(50);
  const [filter, setFilter]     = useState<"ALL" | "ADMIN" | "STAFF" | "SYSTEM">("ALL");
  const [action, setAction]     = useState("");
  const [actorId, setActorId]   = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");

  const pages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL("/api/admin/activity-log", window.location.origin);
    if (filter !== "ALL") url.searchParams.set("actorType", filter);
    if (action.trim())   url.searchParams.set("action", action.trim());
    if (actorId.trim())  url.searchParams.set("actorId", actorId.trim());
    if (fromDate)        url.searchParams.set("from", new Date(fromDate).toISOString());
    if (toDate)          url.searchParams.set("to", new Date(toDate + "T23:59:59").toISOString());
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok) {
      setLogs(data.logs);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [filter, action, actorId, fromDate, toDate, page, limit]);

  useEffect(() => { void load(); }, [load]);

  function applyFilter() {
    setPage(1);
    void load();
  }

  function clearFilters() {
    setFilter("ALL");
    setAction("");
    setActorId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        {/* Actor type tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "ADMIN", "STAFF", "SYSTEM"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300"
              }`}>
              {f}
            </button>
          ))}
          <button onClick={clearFilters}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
            Clear
          </button>
        </div>

        {/* Search row */}
        <div className="flex flex-wrap gap-2">
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            placeholder="Action (e.g. staff.email.send)"
            className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white w-60"
          />
          <input
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            placeholder="Actor ID"
            className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white w-48"
          />
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-slate-400">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-slate-400">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
          </div>
          <button onClick={applyFilter}
            className="px-4 py-1.5 rounded-lg text-xs bg-indigo-600 text-white hover:bg-indigo-700">
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No activity.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950/50 text-xs uppercase text-gray-500 dark:text-slate-400 tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Time</th>
                <th className="text-left px-4 py-2.5 font-medium">Actor</th>
                <th className="text-left px-4 py-2.5 font-medium">Action</th>
                <th className="text-left px-4 py-2.5 font-medium">Target</th>
                <th className="text-left px-4 py-2.5 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                      l.actorType === "ADMIN"  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                      l.actorType === "STAFF"  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>{l.actorType}</span>
                    <span className="text-gray-700 dark:text-slate-300 text-xs">{l.actorLabel ?? ""}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-white">{l.action}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-slate-400">
                    {l.targetType ? `${l.targetType}${l.targetId ? `:${l.targetId.slice(0, 8)}…` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{l.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>
            {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()} entries
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs">Per page</label>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value) as (typeof LIMITS)[number]); setPage(1); }}
                className="px-2 py-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-xs"
              >
                {LIMITS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="px-2 py-1 rounded border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
              >«</button>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
              >‹</button>
              <span className="px-3 py-1 rounded bg-indigo-600 text-white">
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
              >›</button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(pages)}
                className="px-2 py-1 rounded border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800"
              >»</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
