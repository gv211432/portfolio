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

export default function ActivitySection() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ADMIN" | "STAFF" | "SYSTEM">("ALL");
  const [action, setAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL("/api/admin/activity-log", window.location.origin);
    if (filter !== "ALL") url.searchParams.set("actorType", filter);
    if (action) url.searchParams.set("action", action);
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok) setLogs(data.logs);
    setLoading(false);
  }, [filter, action]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["ALL","ADMIN","STAFF","SYSTEM"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700"
            }`}>
            {f}
          </button>
        ))}
        <input value={action} onChange={(e) => setAction(e.target.value)}
          placeholder="Filter by action (e.g. staff.email.send)"
          className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white w-72" />
      </div>

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
                <tr key={l.id}>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                      l.actorType === "ADMIN" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                      l.actorType === "STAFF" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
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
    </div>
  );
}
