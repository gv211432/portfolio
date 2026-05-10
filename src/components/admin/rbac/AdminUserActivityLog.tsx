"use client";

import { useEffect, useState, useCallback } from "react";

interface LogEntry {
  id: string;
  createdAt: string;
  event: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
}

interface Props {
  userId: string;
  username: string;
  onBack: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  LOGIN:              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  LOGOUT:             "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
  USER_CREATED:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  USER_UPDATED:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  USER_DISABLED:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  USER_DELETED:       "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  ROLE_ASSIGNED:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  ROLE_REMOVED:       "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  ROLE_CHANGED:       "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ROLE_CREATED:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ROLE_UPDATED:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ROLE_DELETED:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PERMISSION_CHANGED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ACTION_TOGGLED:     "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default function AdminUserActivityLog({ userId, username, onBack }: Props) {
  const [logs, setLogs]   = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/rbac/users/${userId}/activity?page=${page}&limit=30`);
    if (res.ok) { const { logs, total } = await res.json(); setLogs(logs); setTotal(total); }
    setLoading(false);
  }, [userId, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Activity — <span className="font-mono text-indigo-600 dark:text-indigo-400">@{username}</span>
        </h2>
        <span className="ml-auto text-xs text-gray-500 dark:text-slate-400">{total} events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
            <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 flex items-start gap-4">
                <div className="shrink-0 pt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${EVENT_COLORS[log.event] ?? "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                    {log.event.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="text-xs text-gray-500 dark:text-slate-400 font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{relTime(log.createdAt)}</div>
                  {log.ipAddress && (
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">{log.ipAddress}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {total > 30 && (
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-40 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            ← Newer
          </button>
          <span className="text-xs text-gray-500 dark:text-slate-400">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < 30}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-40 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            Older →
          </button>
        </div>
      )}
    </div>
  );
}
