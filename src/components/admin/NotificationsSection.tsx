"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUrlState } from "@/hooks/useUrlState";

type Channel   = "EMAIL" | "TELEGRAM";
type NStatus   = "SENT" | "FAILED";
type RefType   = "job_application" | "enquiry" | "ngo_application";

interface NotificationLog {
  id        : string;
  createdAt : string;
  channel   : Channel;
  status    : NStatus;
  subject   : string | null;
  body      : string;
  toEmail   : string | null;
  toName    : string | null;
  fromEmail : string | null;
  refType   : string | null;
  refId     : string | null;
  error     : string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h  = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d  = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

const CHANNEL_PILL: Record<Channel, string> = {
  EMAIL:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  TELEGRAM: "bg-sky-100   text-sky-700    dark:bg-sky-900/30    dark:text-sky-400",
};
const STATUS_PILL: Record<NStatus, string> = {
  SENT:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400",
};
const REF_LABELS: Record<RefType, string> = {
  job_application : "Job",
  enquiry         : "Enquiry",
  ngo_application : "NGO",
};

// ── detail panel ──────────────────────────────────────────────────────────

function DetailPanel({ log, onClose }: { log: NotificationLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 z-10">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CHANNEL_PILL[log.channel]}`}>{log.channel}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[log.status]}`}>{log.status}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          {/* meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-400 mb-0.5">Time</p><p className="font-medium text-gray-900 dark:text-white">{new Date(log.createdAt).toLocaleString()}</p></div>
            {log.toEmail && <div><p className="text-xs text-gray-400 mb-0.5">To</p><p className="font-medium text-gray-900 dark:text-white break-all">{log.toName ? `${log.toName} <${log.toEmail}>` : log.toEmail}</p></div>}
            {log.fromEmail && <div><p className="text-xs text-gray-400 mb-0.5">From</p><p className="font-medium text-gray-900 dark:text-white">{log.fromEmail}</p></div>}
            {log.refType && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Source</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {REF_LABELS[log.refType as RefType] ?? log.refType}
                  {log.refId && <span className="text-xs text-gray-400 ml-1.5 font-normal">{log.refId}</span>}
                </p>
              </div>
            )}
          </div>

          {/* subject */}
          {log.subject && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Subject</p>
              <p className="font-semibold text-gray-900 dark:text-white">{log.subject}</p>
            </div>
          )}

          {/* body */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Body</p>
            <pre className="text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 whitespace-pre-wrap text-xs leading-relaxed max-h-72 overflow-y-auto">
              {log.body}
            </pre>
          </div>

          {/* error */}
          {log.error && (
            <div>
              <p className="text-xs text-red-400 mb-1">Error</p>
              <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-xs">{log.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main section ──────────────────────────────────────────────────────────

export default function NotificationsSection() {
  const [urlState, setUrlState] = useUrlState({
    search: "", channel: "", status: "", refType: "", sort: "desc", page: "1", id: "",
  });

  const search    = urlState.search;
  const channel   = urlState.channel;
  const status    = urlState.status;
  const refType   = urlState.refType;
  const sortOrder = urlState.sort as "asc" | "desc";
  const page      = Math.max(1, parseInt(urlState.page) || 1);
  const openId    = urlState.id;

  const [logs,    setLogs]    = useState<NotificationLog[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NotificationLog | null>(null);

  // debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: "25", sortOrder,
      ...(channel         && { channel }),
      ...(status          && { status }),
      ...(refType         && { refType }),
      ...(debouncedSearch && { search: debouncedSearch }),
    });
    const res = await fetch(`/api/admin/notifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, sortOrder, channel, status, refType, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // reopen detail from URL
  useEffect(() => {
    if (openId && logs.length > 0) {
      const found = logs.find((l) => l.id === openId);
      if (found) setSelected(found);
    }
  }, [openId, logs]);

  function openDetail(log: NotificationLog) {
    setSelected(log);
    setUrlState({ id: log.id });
  }

  function closeDetail() {
    setSelected(null);
    setUrlState({ id: "" });
  }

  return (
    <div className="space-y-4">
      {selected && <DetailPanel log={selected} onClose={closeDetail} />}

      {/* ── toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search subject, body, email, name…"
            value={search}
            onChange={(e) => setUrlState({ search: e.target.value, page: "1" })}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* channel filter */}
        <select
          value={channel}
          onChange={(e) => setUrlState({ channel: e.target.value, page: "1" })}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="TELEGRAM">Telegram</option>
        </select>

        {/* status filter */}
        <select
          value={status}
          onChange={(e) => setUrlState({ status: e.target.value, page: "1" })}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>

        {/* refType filter */}
        <select
          value={refType}
          onChange={(e) => setUrlState({ refType: e.target.value, page: "1" })}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Sources</option>
          <option value="job_application">Job Application</option>
          <option value="enquiry">Enquiry</option>
          <option value="ngo_application">NGO Application</option>
        </select>

        {/* sort toggle */}
        <button
          onClick={() => setUrlState({ sort: sortOrder === "desc" ? "asc" : "desc", page: "1" })}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:border-indigo-400 transition whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={sortOrder === "desc"
              ? "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              : "M3 4h13M3 8h9m-9 4h9m-3 4l4 4m0 0l4-4m-4 4V8"} />
          </svg>
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* summary */}
      <p className="text-xs text-gray-400 dark:text-slate-500">{total} log{total !== 1 ? "s" : ""}</p>

      {/* ── table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No notification logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Subject / Message</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => openDetail(log)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                  >
                    {/* channel */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CHANNEL_PILL[log.channel]}`}>
                        {log.channel === "EMAIL" ? "✉ Email" : "✈ TG"}
                      </span>
                    </td>

                    {/* subject / body preview */}
                    <td className="px-4 py-3 max-w-[240px]">
                      {log.subject
                        ? <p className="font-medium text-gray-900 dark:text-white truncate">{log.subject}</p>
                        : <p className="text-gray-400 dark:text-slate-500 truncate text-xs italic">{log.body.slice(0, 80)}</p>
                      }
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{log.body.replace(/<[^>]+>/g, "").slice(0, 60)}</p>
                    </td>

                    {/* recipient */}
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 dark:text-slate-400">
                      {log.toEmail
                        ? <span className="truncate block max-w-[180px]">{log.toName ?? log.toEmail}</span>
                        : <span className="text-gray-300 dark:text-slate-600">—</span>
                      }
                    </td>

                    {/* source */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {log.refType
                        ? <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {REF_LABELS[log.refType as RefType] ?? log.refType}
                          </span>
                        : <span className="text-gray-300 dark:text-slate-600">—</span>
                      }
                    </td>

                    {/* status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[log.status]}`}>
                        {log.status}
                      </span>
                    </td>

                    {/* time */}
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── pagination ── */}
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
