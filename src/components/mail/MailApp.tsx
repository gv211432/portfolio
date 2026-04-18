"use client";

/**
 * MailApp — mailbox UI used by both staff (/mail) and admin impersonation
 * (/admin → Mailbox tab). When `asStaffId` is set, every fetch appends
 * `?asStaffId=...` so the server routes treat it as admin impersonation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Compose from "./Compose";
import MailSettings from "./MailSettings";
import {
  Send, FileEdit, Trash2, ShieldBan, Star, Search,
  PenSquare, Plus, ChevronLeft, Paperclip, Reply,
  ReplyAll, Forward, Mail, MailOpen, Tag, Menu, Clock,
  Users, History, Inbox, Settings, LogOut, ChevronDown,
  Archive, Pin, Check, ChevronUp,
} from "lucide-react";

type Folder = "INBOX" | "SENT" | "DRAFT" | "TRASH" | "SPAM" | "STARRED" | "ARCHIVE";

interface Me {
  staffId: string;
  displayName: string;
  email: string;
  isAdminView: boolean;
  profileImageUrl?: string | null;
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
  isPinned: boolean;
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
  designation?: string;
  source: "directory" | "history";
}

const FOLDERS: { key: Folder; label: string; icon: React.ReactNode }[] = [
  { key: "INBOX", label: "Inbox", icon: <Inbox size={18} /> },
  { key: "SENT", label: "Sent", icon: <Send size={18} /> },
  { key: "DRAFT", label: "Drafts", icon: <FileEdit size={18} /> },
  { key: "ARCHIVE", label: "Archive", icon: <Archive size={18} /> },
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#fee2e2", text: "#dc2626" }, // red
  { bg: "#ffedd5", text: "#ea580c" }, // orange
  { bg: "#fef9c3", text: "#ca8a04" }, // yellow
  { bg: "#dcfce7", text: "#16a34a" }, // green
  { bg: "#d1fae5", text: "#059669" }, // emerald
  { bg: "#ccfbf1", text: "#0d9488" }, // teal
  { bg: "#cffafe", text: "#0891b2" }, // cyan
  { bg: "#e0f2fe", text: "#0284c7" }, // sky
  { bg: "#dbeafe", text: "#2563eb" }, // blue
  { bg: "#e0e7ff", text: "#4f46e5" }, // indigo
  { bg: "#ede9fe", text: "#7c3aed" }, // violet
  { bg: "#f3e8ff", text: "#9333ea" }, // purple
  { bg: "#fce7f3", text: "#db2777" }, // pink
  { bg: "#ffe4e6", text: "#e11d48" }, // rose
];

function senderAvatarColor(char: string) {
  const code = char.toUpperCase().charCodeAt(0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
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
    { draftId?: string; to?: { email: string; name?: string }[]; cc?: { email: string; name?: string }[]; subject?: string; bodyText?: string; bodyHtml?: string; inReplyTo?: string; references?: string[] }
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

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Multi-select + hover state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  // Layout direction (RTL/LTR from localStorage)
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  useEffect(() => {
    const saved = localStorage.getItem("mail_layout_dir") as "ltr" | "rtl" | null;
    if (saved === "rtl" || saved === "ltr") setDir(saved);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setLogoutConfirm(false);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      if (folder === "DRAFT") {
        const res = await fetch(withQs("/api/mail/drafts"));
        const data = await res.json();
        const drafts = (data.drafts ?? []) as {
          id: string; createdAt: string; updatedAt: string;
          toJson: { email: string; name?: string }[];
          subject: string | null; bodyText: string | null;
        }[];
        setEmails(drafts.map((d) => ({
          id: d.id,
          createdAt: d.updatedAt ?? d.createdAt,
          from: { email: me.email, name: me.displayName },
          to: d.toJson ?? [],
          subject: d.subject,
          snippet: d.bodyText?.slice(0, 120) ?? "(no content)",
          folder: "DRAFT",
          isRead: true,
          isStarred: false,
          isPinned: false,
          hasAttachments: false,
          direction: "OUTBOUND",
          threadId: null,
        })));
        return;
      }
      const params: Record<string, string> = { limit: "100" };
      if (folder === "STARRED") {
        params.isStarred = "true";
        params.folder = "STARRED";
      } else {
        params.folder = folder;
        params.groupByThread = folder === "INBOX" ? "true" : "false";
      }
      if (labelId) params.labelId = labelId;
      const url = withQs("/api/mail/emails", params);
      const res = await fetch(url);
      const data = await res.json();
      setEmails(data.emails ?? []);
    } finally {
      setLoading(false);
    }
  }, [folder, labelId, me.displayName, me.email, withQs]);

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
    }, 150);
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
    // Remove from STARRED view when unstarring
    if (folder === "STARRED" && e.isStarred) {
      setEmails((p) => p.filter((x) => x.id !== e.id));
    }
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

  async function handleLogout() {
    await fetch("/api/staff/auth/logout", { method: "POST" });
    window.location.href = "/mail/login";
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
    if (folder === "DRAFT") { void openDraft(id); return; }
    setSelectedId(id);
    setMobilePanel("reader");
  }

  function switchFolder(f: Folder) {
    setFolder(f);
    setLabelId(null);
    setSelectedId(null);
    setSelectedIds(new Set());
    setQuery("");
    setSidebarOpen(false);
    setMobilePanel("list");
    setEmails([]);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map((e) => e.id)));
    }
  }

  async function bulkAction(action: string) {
    if (selectedIds.size === 0) return;
    setBulkMenuOpen(false);
    const ids = Array.from(selectedIds);
    await fetch(withQs("/api/mail/emails/bulk"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    if (action === "delete" || action === "trash" || action === "archive" || action === "spam") {
      setEmails((p) => p.filter((e) => !selectedIds.has(e.id)));
      if (selectedId && selectedIds.has(selectedId)) { setSelectedId(null); setMobilePanel("list"); }
    } else if (action === "markRead") {
      setEmails((p) => p.map((e) => selectedIds.has(e.id) ? { ...e, isRead: true } : e));
    } else if (action === "markUnread") {
      setEmails((p) => p.map((e) => selectedIds.has(e.id) ? { ...e, isRead: false } : e));
    } else if (action === "pin") {
      setEmails((p) => p.map((e) => selectedIds.has(e.id) ? { ...e, isPinned: true } : e));
    } else if (action === "unpin") {
      setEmails((p) => p.map((e) => selectedIds.has(e.id) ? { ...e, isPinned: false } : e));
    }
    setSelectedIds(new Set());
  }

  async function archiveEmail(id: string) {
    await patchEmail(id, { folder: "ARCHIVE" });
    setEmails((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) { setSelectedId(null); setMobilePanel("list"); }
  }

  async function togglePin(e: EmailRow) {
    const next = !e.isPinned;
    setEmails((prev) => {
      const updated = prev.map((x) => x.id === e.id ? { ...x, isPinned: next } : x);
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    await patchEmail(e.id, { isPinned: next });
  }

  async function openDraft(id: string) {
    const res = await fetch(withQs(`/api/mail/drafts/${id}`));
    if (!res.ok) return;
    const { draft } = await res.json();
    setComposeInit({
      draftId: id,
      to: draft.toJson ?? [],
      cc: draft.ccJson ?? [],
      subject: draft.subject ?? "",
      bodyHtml: draft.bodyHtml ?? undefined,
      bodyText: draft.bodyText ?? undefined,
    });
    setComposeOpen(true);
  }

  const unreadCount = useMemo(() => emails.filter((e) => !e.isRead).length, [emails]);

  return (
    <div dir={dir} className="h-screen flex flex-col bg-gray-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100">
      {/* ===== Top bar ===== */}
      <header className="relative z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161616] shrink-0">
        {/* Mobile menu toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Image
            src="/img/logo/gaurav-dot-one-transparent-gray.webp"
            alt="Gaurav.one"
            width={100}
            height={28}
            className="block dark:hidden h-7 w-auto object-contain rounded-lg"
            priority
          />
          <Image
            src="/img/logo/gaurav-dot-one-white.webp"
            alt="Gaurav.one"
            width={100}
            height={28}
            className="hidden dark:block h-7 w-auto object-contain rounded-lg"
            priority
          />
          {me.isAdminView && (
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
              Impersonating
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Mail search */}
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mail..."
            className="w-36 sm:w-48 lg:w-60 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
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
            className="w-40 lg:w-52 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
          />
          {contactOpen && contactResults.length > 0 && (
            <div className="absolute top-full mt-1 right-0 w-80 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
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
                    {c.designation && (
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{c.designation}</div>
                    )}
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

        {/* Profile dropdown */}
        {!me.isAdminView && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setLogoutConfirm(false); }}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Account"
            >
              {me.profileImageUrl ? (
                <img
                  src={me.profileImageUrl}
                  alt={me.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none">
                  {getInitials(me.displayName)}
                </div>
              )}
              <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{me.displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{me.email}</div>
                </div>

                {/* Settings */}
                <button
                  onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition"
                >
                  <Settings size={15} className="text-gray-400" />
                  Settings
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Logout */}
                {!logoutConfirm ? (
                  <button
                    onClick={() => setLogoutConfirm(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2.5 transition"
                  >
                    <LogOut size={15} className="text-gray-400" />
                    Sign out
                  </button>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Sign out of your account?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLogout}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                      >
                        Sign out
                      </button>
                      <button
                        onClick={() => setLogoutConfirm(false)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ===== Sidebar ===== */}
        <aside className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-40
          w-60 border-r border-gray-200 dark:border-gray-800
          flex flex-col bg-white dark:bg-[#161616]
          transition-transform duration-200 ease-in-out
          pt-14 lg:pt-0
        `}>
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
            {/* ===== Favourites ===== */}
            <div className="pb-1 px-1">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-600 px-2 py-1">
                Favourites
              </div>
              <button
                onClick={() => switchFolder("STARRED")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
                  folder === "STARRED" && !labelId
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <Star
                  size={18}
                  className={folder === "STARRED" && !labelId
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-400 dark:text-gray-500"}
                />
                <span className="flex-1">Starred</span>
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800/60 my-1" />

            {/* ===== Folders ===== */}
            {FOLDERS.map((f) => {
              const active = folder === f.key && !labelId;
              return (
                <button
                  key={f.key}
                  onClick={() => switchFolder(f.key)}
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

            {/* ===== Labels ===== */}
            <div className="pt-4 pb-1 px-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-600">Labels</span>
              <button onClick={createLabel} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <Plus size={14} className="text-gray-400" />
              </button>
            </div>
            {labels.map((l) => (
              <button
                key={l.id}
                onClick={() => { setLabelId(l.id); setSelectedId(null); setSidebarOpen(false); setEmails([]); }}
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
          {/* List header: title + bulk bar */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-2 min-h-[44px]">
            {/* Select-all checkbox */}
            <button
              onClick={selectAll}
              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                selectedIds.size > 0 && selectedIds.size === emails.length
                  ? "bg-indigo-600 border-indigo-600"
                  : selectedIds.size > 0
                  ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
              }`}
              title="Select all"
            >
              {selectedIds.size > 0 && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </button>

            {selectedIds.size > 0 ? (
              <>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">
                  {selectedIds.size} selected
                </span>
                {/* Bulk actions dropdown */}
                <div className="relative ml-1" ref={bulkMenuRef}>
                  <button
                    onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
                  >
                    Actions <ChevronUp size={12} className={`transition-transform ${bulkMenuOpen ? "" : "rotate-180"}`} />
                  </button>
                  {bulkMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      {([
                        { label: "Mark as read", action: "markRead" },
                        { label: "Mark as unread", action: "markUnread" },
                        { label: "Archive", action: "archive" },
                        { label: "Move to trash", action: "trash" },
                        { label: "Mark as spam", action: "spam" },
                        { label: "Pin", action: "pin" },
                        { label: "Unpin", action: "unpin" },
                        { label: "Delete permanently", action: "delete" },
                      ] as { label: string; action: string }[]).map((item) => (
                        <button
                          key={item.action}
                          onClick={() => void bulkAction(item.action)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                            item.action === "delete" ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-auto"
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {searchMode
                    ? "Search Results"
                    : folder === "STARRED"
                    ? "Starred"
                    : labelId
                    ? labels.find((l) => l.id === labelId)?.name ?? ""
                    : FOLDERS.find((f) => f.key === folder)?.label}
                </h2>
                {loading && (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {searchMode && (
                  <button onClick={() => { setQuery(""); setSearchMode(false); }}
                    className="text-xs text-indigo-600 hover:underline">Clear</button>
                )}
                <div className="flex-1" />
                {!loading && <span className="text-xs text-gray-400">{emails.length} {emails.length === 1 ? "email" : "emails"}</span>}
              </>
            )}
          </div>

          {folder === "TRASH" && (
            <div className="mx-3 mt-2 mb-1 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Trash2 size={13} className="shrink-0" />
              Emails in Trash are automatically deleted after 30 days.
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading && emails.length === 0 && (
              <div className="p-2 space-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="flex-1 h-3.5 rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="w-8 h-3 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                    <div className="mt-1.5 h-3.5 rounded bg-gray-100 dark:bg-gray-800/60 w-3/4" />
                    <div className="mt-1 h-3 rounded bg-gray-100 dark:bg-gray-800/40 w-full" />
                  </div>
                ))}
              </div>
            )}
            {!loading && emails.length === 0 && (
              <div className="p-8 text-center">
                <MailOpen size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {searchMode ? "No results found." : folder === "STARRED" ? "No starred emails." : "Nothing here yet."}
                </p>
              </div>
            )}
            {emails.map((e) => {
              const isHovered = hoverId === e.id;
              const isChecked = selectedIds.has(e.id);
              return (
                <div
                  key={e.id}
                  onClick={() => selectEmail(e.id)}
                  onMouseEnter={() => setHoverId(e.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`relative cursor-pointer px-3 py-3 border-b border-gray-100 dark:border-gray-800/50 transition-colors ${
                    selectedId === e.id
                      ? "bg-indigo-50 dark:bg-indigo-950/40"
                      : isChecked
                      ? "bg-indigo-50/60 dark:bg-indigo-950/20"
                      : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Left column: avatar → checkbox on hover/select; star on hover or if starred */}
                    <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5" style={{ width: 22 }}>
                      {(isHovered || isChecked) ? (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); toggleSelect(e.id); }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-400 dark:border-gray-500 hover:border-indigo-500 bg-white dark:bg-[#1e1e1e]"
                          }`}
                          aria-label="Select"
                        >
                          {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                        </button>
                      ) : (() => {
                        const initial = (e.from.name || e.from.email).charAt(0).toUpperCase();
                        const color = senderAvatarColor(initial);
                        return (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold select-none"
                            style={{ background: color.bg, color: color.text }}
                          >
                            {initial}
                          </div>
                        );
                      })()}
                      {(isHovered || e.isStarred) && (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); void toggleStar(e); }}
                          aria-label="Star"
                        >
                          <Star size={13}
                            className={e.isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600 hover:text-amber-400"}
                          />
                        </button>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 truncate text-sm ${!e.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {e.isPinned && <Pin size={11} className="inline mr-1 text-indigo-500 -mt-0.5" />}
                          {e.from.name || e.from.email}
                        </div>

                        {/* Right: quick actions on hover, otherwise time */}
                        <div className="shrink-0 flex items-center gap-1">
                          {isHovered ? (
                            <div onClick={(ev) => ev.stopPropagation()} className="flex items-center gap-0.5">
                              <button
                                onClick={() => void togglePin(e)}
                                title={e.isPinned ? "Unpin" : "Pin"}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              >
                                <Pin size={13} className={e.isPinned ? "text-indigo-500" : "text-gray-400 hover:text-indigo-500"} />
                              </button>
                              <button
                                onClick={() => void archiveEmail(e.id)}
                                title="Archive"
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              >
                                <Archive size={13} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
                              </button>
                              <button
                                onClick={() => void deleteEmail(e.id)}
                                title="Trash"
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                              >
                                <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <>
                              {e.hasAttachments && <Paperclip size={12} className="text-gray-400" />}
                              <span className="text-[11px] text-gray-400">{timeAgo(e.createdAt)}</span>
                            </>
                          )}
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
                    </div>
                  </div>
                </div>
              );
            })}
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
              <button
                onClick={() => { setSelectedId(null); setMobilePanel("list"); }}
                className="sm:hidden flex items-center gap-1 text-sm text-indigo-600 mb-4"
              >
                <ChevronLeft size={16} /> Back to list
              </button>

              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex-1 leading-tight">
                  {selected.subject || "(no subject)"}
                </h1>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <ActionBtn onClick={() => openReply(false)} icon={<Reply size={14} />} label="Reply" primary />
                  <ActionBtn onClick={() => openReply(true)} icon={<ReplyAll size={14} />} label="Reply all" />
                  <ActionBtn onClick={openForward} icon={<Forward size={14} />} label="Forward" />
                  {selected.folder === "ARCHIVE" && (
                    <ActionBtn
                      onClick={() => moveToFolder(selected.id, "INBOX")}
                      icon={<Archive size={14} />}
                      label="Unarchive"
                    />
                  )}
                  {selected.folder !== "ARCHIVE" && (
                    <ActionBtn
                      onClick={() => void archiveEmail(selected.id)}
                      icon={<Archive size={14} />}
                      label="Archive"
                    />
                  )}
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

              <div className="mt-4 rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                {selected.html ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none
                      prose-a:text-indigo-600 prose-img:rounded-lg prose-img:max-w-full
                      [&_*]:max-w-full overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: selected.html }}
                  />
                ) : (
                  <PlainTextBody text={selected.bodyText} />
                )}
              </div>

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
            if (sent || folder === "DRAFT") void fetchEmails();
          }}
        />
      )}

      {settingsOpen && (
        <MailSettings
          me={me}
          onClose={() => setSettingsOpen(false)}
          onDirChange={(d) => {
            setDir(d);
            localStorage.setItem("mail_layout_dir", d);
          }}
        />
      )}
    </div>
  );
}

function PlainTextBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const groups: { depth: number; lines: string[] }[] = [];
  for (const raw of lines) {
    const match = raw.match(/^(>[\s>]*)/);
    const depth = match ? (match[1].match(/>/g) ?? []).length : 0;
    const content = depth > 0 ? raw.replace(/^(>[\s>]*)/, "").trimStart() : raw;
    const last = groups[groups.length - 1];
    if (last && last.depth === depth) {
      last.lines.push(content);
    } else {
      groups.push({ depth, lines: [content] });
    }
  }

  return (
    <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 space-y-1">
      {groups.map((g, i) => {
        const content = g.lines.join("\n");
        if (g.depth === 0) {
          return <pre key={i} className="whitespace-pre-wrap font-sans m-0">{content}</pre>;
        }
        const colors = [
          "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
          "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
          "border-green-400 bg-green-50/50 dark:bg-green-950/20",
          "border-purple-400 bg-purple-50/50 dark:bg-purple-950/20",
        ];
        return (
          <blockquote
            key={i}
            className={`border-l-[3px] ${colors[Math.min(g.depth - 1, colors.length - 1)]} pl-3 py-1.5 rounded-r-md my-1`}
            style={{ marginLeft: `${(g.depth - 1) * 12}px` }}
          >
            <pre className="whitespace-pre-wrap font-sans m-0 text-gray-600 dark:text-gray-400 text-[13px]">{content}</pre>
          </blockquote>
        );
      })}
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
  return <button onClick={onClick} className={`${base} ${variant}`}>{icon}{label}</button>;
}
