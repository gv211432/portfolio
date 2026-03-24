"use client";

import { useEffect, useState, useCallback } from "react";
import { useUrlState } from "@/hooks/useUrlState";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatThread {
  id: string;
  token: string;
  ipAddress?: string;
  deviceInfo?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  messages: { content: string; role: string; createdAt: string }[];
}

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

function highlightMoney(text: string) {
  return text.replace(/(\$[\d,.]+[kKmMbB]?|\d+[kKmM]\s*(usd|USD|dollars?)|\b(budget|invest|quote|proposal)\b)/g,
    (match) => `<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 px-0.5 rounded">${match}</mark>`
  );
}

function ThreadViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/chats/${id}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.thread?.messages ?? []))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">Chat Thread</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No messages in this thread.</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm"
              }`}>
                <p
                  className="whitespace-pre-wrap break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msg.role === "user" ? highlightMoney(msg.content) : msg.content }}
                />
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-indigo-200" : "text-gray-400 dark:text-slate-500"}`}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatsSection() {
  const [urlState, setUrlState] = useUrlState({
    search: "", money: "", sort: "desc", page: "1", thread: "",
  });

  const search = urlState.search;
  const moneyOnly = urlState.money === "1";
  const sortOrder = urlState.sort as "asc" | "desc";
  const page = Math.max(1, parseInt(urlState.page) || 1);
  const viewingId = urlState.thread || null;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cleanDays, setCleanDays] = useState("30");
  const [cleaning, setCleaning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      sortOrder,
      ...(search && { search }),
      ...(moneyOnly && { moneyOnly: "true" }),
    });
    const res = await fetch(`/api/admin/chats?${params}`);
    const data = await res.json();
    setThreads(data.threads ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, moneyOnly, sortOrder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteThread(id: string) {
    if (!confirm("Delete this chat session and all messages? Cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/admin/chats/${id}`, { method: "DELETE" });
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setTotal((n) => n - 1);
    setDeleting(null);
  }

  async function bulkClean() {
    const days = parseInt(cleanDays);
    if (isNaN(days) || days < 1) return;
    if (!confirm(`Delete all chat sessions older than ${days} days? This cannot be undone.`)) return;
    setCleaning(true);
    const res = await fetch(`/api/admin/chats?olderThanDays=${days}`, { method: "DELETE" });
    const data = await res.json();
    alert(`Deleted ${data.deleted} session(s).`);
    fetchData();
    setCleaning(false);
  }

  return (
    <div className="space-y-4">
      {viewingId && <ThreadViewer id={viewingId} onClose={() => setUrlState({ thread: "" })} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat Sessions</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{total.toLocaleString()} total sessions</p>
        </div>

        {/* Bulk Clean */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">Clean older than</label>
          <input
            type="number"
            min="1"
            value={cleanDays}
            onChange={(e) => setCleanDays(e.target.value)}
            className="w-16 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-500 text-center"
          />
          <span className="text-xs text-gray-500 dark:text-slate-400">days</span>
          <button
            onClick={bulkClean}
            disabled={cleaning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {cleaning ? "Cleaning…" : "Clean"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          placeholder="Search message content…"
          value={search}
          onChange={(e) => setUrlState({ search: e.target.value, money: "", page: "1" })}
          className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => setUrlState({ money: moneyOnly ? "" : "1", search: "", page: "1" })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
            moneyOnly
              ? "bg-yellow-500 border-yellow-500 text-white"
              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-yellow-400"
          }`}
        >
          <span>💰</span>
          Money Filter
        </button>
        <select
          value={sortOrder}
          onChange={(e) => setUrlState({ sort: e.target.value, page: "1" })}
          className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {/* Thread List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No chat sessions found.</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {threads.map((t) => {
              const lastMsg = t.messages?.[0];
              const device = (t.deviceInfo as Record<string, string> | null);
              return (
                <div
                  key={t.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                  onClick={() => setUrlState({ thread: t.id })}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-400 dark:text-slate-500">
                          {t.token.slice(0, 8)}…
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {t._count.messages} msg{t._count.messages !== 1 ? "s" : ""}
                        </span>
                        {t.ipAddress && (
                          <>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">{t.ipAddress}</span>
                          </>
                        )}
                        {device?.deviceType && (
                          <>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">{device.deviceType}</span>
                          </>
                        )}
                      </div>
                      {lastMsg && (
                        <p
                          className="text-sm text-gray-600 dark:text-slate-300 truncate"
                          dangerouslySetInnerHTML={{
                            __html: lastMsg.role === "user"
                              ? highlightMoney(lastMsg.content.slice(0, 120))
                              : lastMsg.content.slice(0, 120),
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(t.createdAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                        disabled={deleting === t.id}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title="Delete session"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setUrlState({ page: String(Math.max(1, page - 1)) })} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300">Prev</button>
            <button onClick={() => setUrlState({ page: String(Math.min(pages, page + 1)) })} disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-300">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
