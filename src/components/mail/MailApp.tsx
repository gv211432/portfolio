"use client";

/**
 * MailApp — mailbox UI used by both staff (/mail) and admin impersonation
 * (/admin → Mailbox tab). When `asStaffId` is set, every fetch appends
 * `?asStaffId=...` so the server routes treat it as admin impersonation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Compose from "./Compose";
import {
  Inbox, Send, FileEdit, Trash2, ShieldBan, Star, Search,
  PenSquare, Plus, LogOut, ChevronLeft, Paperclip, Reply,
  ReplyAll, Forward, Mail, MailOpen, Tag, Menu, X, Clock,
  Users, History,
} from "lucide-react";

type Folder = "INBOX" | "SENT" | "DRAFT" | "TRASH" | "SPAM";

interface Me {
  staffId: string;
  displayName: string;
  email: string;
  isAdminView: boolean;
}

interface Label { id: string; name: string; color: string | null }

interface EmailRow {
  id: string;
  createdAt: string;
  from: { email: string; name: string | null };
  to: unknown;
  subject: string | null;
  snippet: string;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  direction: string;
  threadId: string | null;
  labels?: Label[];
}

interface EmailFull extends EmailRow {
  bodyText: string;
  html?: string;
  inReplyTo: string | null;
  references: unknown;
  messageId: string;
  attachments: { id: string; filename: string; contentType: string; sizeBytes: number; url: string }[];
  cc?: unknown;
  bcc?: unknown;
}

interface Props {
  me: Me;
  asStaffId?: string;
}

interface ContactSuggestion {
  email: string;
  name?: string;
  source: "directory" | "history";
}

const FOLDERS: { key: Folder; label: string; icon: React.ReactNode }[] = [
  { key: "INBOX", label: "Inbox", icon: <Inbox size={18} /> },
  { key: "SENT", label: "Sent", icon: <Send size={18} /> },
  { key: "DRAFT", label: "Drafts", icon: <FileEdit size={18} /> },
  { key: "TRASH", label: "Trash", icon: <Trash2 size={18} /> },
  { key: "SPAM", label: "Spam", icon: <ShieldBan size={18} /> },
];

function timeAgo(d: string) {
  const now = Date.now();
  const t = new Date(d).getTime();
  const diff = now - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.ceil(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MailApp({ me, asStaffId }: Props) {
  const withQs = useCallback(
    (url: string, extra?: Record<string, string>) => {
      const u = new URL(url, window.location.origin);
      if (asStaffId) u.searchParams.set("asStaffId", asStaffId);
      if (extra) for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
      return u.pathname + "?" + u.searchParams.toString();
    },
    [asStaffId],
  );

  const [folder, setFolder] = useState<Folder>("INBOX");
  const [labelId, setLabelId] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmailFull | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInit, setComposeInit] = useState<
    { to?: { email: string; name?: string }[]; subject?: string; bodyText?: string; inReplyTo?: string; references?: string[] }
    | undefined
  >(undefined);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile state
  const [mobilePanel, setMobilePanel] = useState<"sidebar" | "list" | "reader">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Contact/address search
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<ContactSuggestion[]>([]);
  const [contactOpen, setContactOpen] = useState(false);
  const contactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const url = withQs("/api/mail/emails", {
        folder,
        ...(labelId ? { labelId } : {}),
        groupByThread: folder === "INBOX" ? "true" : "false",
        limit: "100",
      });
      const res = await fetch(url);
      const data = await res.json();
      setEmails(data.emails ?? []);
    } finally {
      setLoading(false);
    }
  }, [folder, labelId, withQs]);

  const fetchLabels = useCallback(async () => {
    const res = await fetch(withQs("/api/mail/labels"));
    const data = await res.json();
    setLabels(data.labels ?? []);
  }, [withQs]);

  useEffect(() => { void fetchLabels(); }, [fetchLabels]);
  useEffect(() => {
    if (!searchMode) void fetchEmails();
  }, [fetchEmails, searchMode]);

  // Fuzzy search (debounced)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q) { setSearchMode(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchMode(true);
      setLoading(true);
      try {
        const url = withQs("/api/mail/search", { q, limit: "50" });
        const res = await fetch(url);
        const data = await res.json();
        setEmails(data.emails ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query, withQs]);

  // Contact search (debounced)
  useEffect(() => {
    if (contactTimer.current) clearTimeout(contactTimer.current);
    const q = contactQuery.trim();
    if (!q) { setContactResults([]); return; }
    contactTimer.current = setTimeout(async () => {
      try {
        const url = withQs("/api/mail/contacts", { q, limit: "10" });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setContactResults(data.contacts ?? []);
        }
      } catch { /* ignore */ }
    }, 200);
  }, [contactQuery, withQs]);

  // Load selected email
  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    (async () => {
      const res = await fetch(withQs(`/api/mail/emails/${selectedId}`));
      if (!res.ok) { setSelected(null); return; }
      const data = await res.json();
      setSelected(data.email);
      setEmails((prev) => prev.map((e) => (e.id === selectedId ? { ...e, isRead: true } : e)));
    })();
  }, [selectedId, withQs]);

  async function patchEmail(id: string, patch: Record<string, unknown>) {
    await fetch(withQs(`/api/mail/emails/${id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function deleteEmail(id: string) {
    await fetch(withQs(`/api/mail/emails/${id}`), { method: "DELETE" });
    setEmails((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) { setSelectedId(null); setMobilePanel("list"); }
  }

  async function toggleStar(e: EmailRow) {
    setEmails((p) => p.map((x) => (x.id === e.id ? { ...x, isStarred: !x.isStarred } : x)));
    await patchEmail(e.id, { isStarred: !e.isStarred });
  }

  async function moveToFolder(id: string, to: Folder) {
    await patchEmail(id, { folder: to });
    setEmails((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) { setSelectedId(null); setMobilePanel("list"); }
  }

  async function createLabel() {
    const name = prompt("Label name")?.trim();
    if (!name) return;
    await fetch(withQs("/api/mail/labels"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    void fetchLabels();
  }

  function openReply(all: boolean) {
    if (!selected) return;
    const toList = [{ email: selected.from.email, name: selected.from.name ?? undefined }];
    const cc = all && Array.isArray(selected.cc) ? (selected.cc as { email: string; name?: string }[]) : undefined;
    const subject = selected.subject?.toLowerCase().startsWith("re:")
      ? selected.subject
      : `Re: ${selected.subject ?? ""}`;
    const quote = `\n\n\n--- On ${new Date(selected.createdAt).toLocaleString()} ${selected.from.email} wrote: ---\n${selected.bodyText.split("\n").map((l) => "> " + l).join("\n")}`;
    const references = [
      ...(Array.isArray(selected.references) ? (selected.references as string[]) : []),
      selected.messageId,
    ];
    setComposeInit({
      to: cc ? [...toList, ...cc] : toList,
      subject,
      bodyText: quote,
      inReplyTo: selected.messageId,
      references,
    });
    setComposeOpen(true);
  }

  function openForward() {
    if (!selected) return;
    const subject = selected.subject?.toLowerCase().startsWith("fwd:")
      ? selected.subject
      : `Fwd: ${selected.subject ?? ""}`;
    const bodyText = `\n\n--- Forwarded message ---\nFrom: ${selected.from.email}\nSubject: ${selected.subject ?? ""}\n\n${selected.bodyText}`;
    setComposeInit({ subject, bodyText });
    setComposeOpen(true);
  }

  function selectEmail(id: string) {
    setSelectedId(id);
    setMobilePanel("reader");
  }

  const unreadCount = useMemo(() => emails.filter((e) => !e.isRead).length, [emails]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100">
      {/* ===== Top bar ===== */}
      <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161616] shrink-0">
        {/* Mobile menu toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Mail size={20} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
            {me.isAdminView ? "Mailbox" : "Mail"}
          </span>
          {me.isAdminView && (
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
              Impersonating
            </span>
          )}
        </div>

        <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-500 truncate max-w-[200px]">
          {me.displayName}
        </div>

        <div className="flex-1" />

        {/* Mail search */}
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mail..."
            className="w-36 sm:w-56 lg:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
          />
        </div>

        {/* Contact / address search */}
        <div className="relative hidden md:block">
          <Users size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={contactQuery}
            onChange={(e) => { setContactQuery(e.target.value); setContactOpen(true); }}
            onFocus={() => contactQuery.trim() && setContactOpen(true)}
            onBlur={() => setTimeout(() => setContactOpen(false), 200)}
            placeholder="Find contacts..."
            className="w-44 lg:w-56 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
          />
          {contactOpen && contactResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 w-72 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {contactResults.map((c, i) => (
                <button
                  key={`${c.email}-${i}`}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setComposeInit({ to: [{ email: c.email, name: c.name }] });
                    setComposeOpen(true);
                    setContactQuery("");
                    setContactOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {(c.name || c.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {c.name && <div className="text-sm font-medium truncate">{c.name}</div>}
                    <div className="text-xs text-gray-500 truncate">{c.email}</div>
                  </div>
                  {c.source === "directory" ? (
                    <Users size={13} className="text-gray-400 shrink-0" />
                  ) : (
                    <History size={13} className="text-gray-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {!me.isAdminView && (
          <button
            onClick={async () => {
              await fetch("/api/staff/auth/logout", { method: "POST" });
              window.location.href = "/mail/login";
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ===== Sidebar ===== */}
        {/* Desktop: always visible. Mobile: overlay */}
        <aside className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-40
          w-60 border-r border-gray-200 dark:border-gray-800
          flex flex-col bg-white dark:bg-[#161616]
          transition-transform duration-200 ease-in-out
          pt-14 lg:pt-0
        `}>
          {/* Mobile overlay close */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/30 z-[-1] lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <div className="p-3">
            <button
              onClick={() => { setComposeInit(undefined); setComposeOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium shadow-sm shadow-indigo-600/20 transition"
            >
              <PenSquare size={16} />
              Compose
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
            {FOLDERS.map((f) => {
              const active = folder === f.key && !labelId;
              return (
                <button
                  key={f.key}
                  onClick={() => { setFolder(f.key); setLabelId(null); setSelectedId(null); setQuery(""); setSidebarOpen(false); setMobilePanel("list"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <span className={active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}>
                    {f.icon}
                  </span>
                  <span className="flex-1">{f.label}</span>
                  {f.key === "INBOX" && unreadCount > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 pb-1 px-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-600">Labels</span>
              <button onClick={createLabel} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <Plus size={14} className="text-gray-400" />
              </button>
            </div>
            {labels.map((l) => (
              <button
                key={l.id}
                onClick={() => { setLabelId(l.id); setSelectedId(null); setSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
                  labelId === l.id
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color ?? "#94a3b8" }} />
                <span className="truncate">{l.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ===== Email List ===== */}
        <section className={`
          w-full sm:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800
          flex flex-col bg-white dark:bg-[#161616]
          ${mobilePanel !== "list" ? "hidden sm:flex" : "flex"}
        `}>
          {/* Folder title */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {searchMode ? "Search Results" : labelId ? labels.find((l) => l.id === labelId)?.name ?? "" : FOLDERS.find((f) => f.key === folder)?.label}
            </h2>
            {searchMode && (
              <button onClick={() => { setQuery(""); setSearchMode(false); }}
                className="text-xs text-indigo-600 hover:underline">Clear</button>
            )}
            <div className="flex-1" />
            <span className="text-xs text-gray-400">{emails.length} {emails.length === 1 ? "email" : "emails"}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && emails.length === 0 && (
              <div className="p-8 text-center">
                <MailOpen size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {searchMode ? "No results found." : "Nothing here yet."}
                </p>
              </div>
            )}
            {emails.map((e) => (
              <button
                key={e.id}
                onClick={() => selectEmail(e.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 transition-colors ${
                  selectedId === e.id
                    ? "bg-indigo-50 dark:bg-indigo-950/40"
                    : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); void toggleStar(e); }}
                    className="shrink-0"
                    aria-label="Star"
                  >
                    <Star size={16}
                      className={e.isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-700 hover:text-amber-400"}
                    />
                  </button>
                  <div className={`flex-1 truncate text-sm ${!e.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {e.from.name || e.from.email}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {e.hasAttachments && <Paperclip size={13} className="text-gray-400" />}
                    <span className="text-[11px] text-gray-400">{timeAgo(e.createdAt)}</span>
                  </div>
                </div>
                <div className={`mt-0.5 text-sm truncate ${!e.isRead ? "font-medium text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                  {e.subject || "(no subject)"}
                </div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-600 truncate leading-relaxed">
                  {e.snippet}
                </div>
                {e.labels && e.labels.length > 0 && (
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {e.labels.map((l) => (
                      <span key={l.id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: (l.color ?? "#64748b") + "15", color: l.color ?? "#64748b" }}>
                        <Tag size={9} />
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ===== Reader ===== */}
        <section className={`
          flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0f0f0f]
          ${mobilePanel !== "reader" && !selected ? "hidden sm:block" : ""}
          ${mobilePanel === "reader" ? "block" : "hidden sm:block"}
        `}>
          {!selected && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-700 gap-3">
              <Mail size={48} strokeWidth={1.2} />
              <p className="text-sm">Select a message to read</p>
            </div>
          )}
          {selected && (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
              {/* Mobile back button */}
              <button
                onClick={() => { setSelectedId(null); setMobilePanel("list"); }}
                className="sm:hidden flex items-center gap-1 text-sm text-indigo-600 mb-4"
              >
                <ChevronLeft size={16} /> Back to list
              </button>

              {/* Subject + actions */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex-1 leading-tight">
                  {selected.subject || "(no subject)"}
                </h1>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <ActionBtn onClick={() => openReply(false)} icon={<Reply size={14} />} label="Reply" primary />
                  <ActionBtn onClick={() => openReply(true)} icon={<ReplyAll size={14} />} label="Reply all" />
                  <ActionBtn onClick={openForward} icon={<Forward size={14} />} label="Forward" />
                  <ActionBtn
                    onClick={() => {
                      if (selected.folder === "TRASH") deleteEmail(selected.id);
                      else moveToFolder(selected.id, "TRASH");
                    }}
                    icon={<Trash2 size={14} />}
                    label={selected.folder === "TRASH" ? "Delete" : "Trash"}
                    danger
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-4 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {(selected.from.name || selected.from.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selected.from.name || selected.from.email}
                    </div>
                    {selected.from.name && (
                      <div className="text-xs text-gray-500 truncate">{selected.from.email}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">
                      To: {Array.isArray(selected.to) ? (selected.to as { email: string }[]).map((a) => a.email).join(", ") : ""}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(selected.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="mt-4 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                {selected.html ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                      prose-a:text-indigo-600 prose-img:rounded-lg prose-img:max-w-full
                      [&_*]:max-w-full overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: selected.html }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                    {selected.bodyText}
                  </pre>
                )}
              </div>

              {/* Attachments */}
              {selected.attachments.length > 0 && (
                <div className="mt-4 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-600 mb-3 flex items-center gap-1.5">
                    <Paperclip size={13} />
                    Attachments ({selected.attachments.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((a) => (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                        className="group flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition">
                        <Paperclip size={14} className="text-gray-400 group-hover:text-indigo-500" />
                        <span className="truncate max-w-[160px]">{a.filename}</span>
                        <span className="text-xs text-gray-400">{formatBytes(a.sizeBytes)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                <button onClick={() => moveToFolder(selected.id, selected.folder === "SPAM" ? "INBOX" : "SPAM")}
                  className="flex items-center gap-1 hover:text-indigo-600 transition">
                  <ShieldBan size={13} />
                  {selected.folder === "SPAM" ? "Not spam" : "Report spam"}
                </button>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <button onClick={() => patchEmail(selected.id, { isRead: false })}
                  className="flex items-center gap-1 hover:text-indigo-600 transition">
                  <MailOpen size={13} />
                  Mark unread
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {composeOpen && (
        <Compose
          me={me}
          asStaffId={asStaffId}
          initial={composeInit}
          onClose={(sent) => {
            setComposeOpen(false);
            setComposeInit(undefined);
            if (sent) void fetchEmails();
          }}
        />
      )}
    </div>
  );
}

function ActionBtn({ onClick, icon, label, primary, danger }: {
  onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean; danger?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition";
  const variant = primary
    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
    : danger
    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";
  return (
    <button onClick={onClick} className={`${base} ${variant}`}>
      {icon}{label}
    </button>
  );
}
