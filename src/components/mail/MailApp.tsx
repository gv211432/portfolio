"use client";

/**
 * MailApp — mailbox UI used by both staff (/mail) and admin impersonation
 * (/admin → Mailbox tab). When `asStaffId` is set, every fetch appends
 * `?asStaffId=...` so the server routes treat it as admin impersonation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Compose from "./Compose";

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

const FOLDERS: { key: Folder; label: string; icon: string }[] = [
  { key: "INBOX", label: "Inbox", icon: "📥" },
  { key: "SENT", label: "Sent", icon: "📤" },
  { key: "DRAFT", label: "Drafts", icon: "📝" },
  { key: "TRASH", label: "Trash", icon: "🗑️" },
  { key: "SPAM", label: "Spam", icon: "🚫" },
];

export default function MailApp({ me, asStaffId }: Props) {
  const qs = useMemo(() => (asStaffId ? `asStaffId=${asStaffId}` : ""), [asStaffId]);
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

  // Load selected email
  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    (async () => {
      const res = await fetch(withQs(`/api/mail/emails/${selectedId}`));
      if (!res.ok) { setSelected(null); return; }
      const data = await res.json();
      setSelected(data.email);
      // reflect read status locally
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
    if (selectedId === id) setSelectedId(null);
  }

  async function toggleStar(e: EmailRow) {
    setEmails((p) => p.map((x) => (x.id === e.id ? { ...x, isStarred: !x.isStarred } : x)));
    await patchEmail(e.id, { isStarred: !e.isStarred });
  }

  async function moveToFolder(id: string, to: Folder) {
    await patchEmail(id, { folder: to });
    setEmails((p) => p.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="font-semibold text-indigo-600 dark:text-indigo-400">
          {me.isAdminView ? "Mailbox (impersonating)" : "Mail"}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {me.displayName} &lt;{me.email}&gt;
        </div>
        <div className="flex-1" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mail…"
          className="w-72 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        />
        {!me.isAdminView && (
          <a href="/api/staff/auth/logout" onClick={async (e) => {
            e.preventDefault();
            await fetch("/api/staff/auth/logout", { method: "POST" });
            window.location.href = "/mail/login";
          }} className="text-sm text-slate-500 hover:text-indigo-600">Sign out</a>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-1 bg-white dark:bg-slate-900">
          <button
            onClick={() => { setComposeInit(undefined); setComposeOpen(true); }}
            className="mb-3 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
          >
            ✏️ Compose
          </button>
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFolder(f.key); setLabelId(null); setSelectedId(null); setQuery(""); }}
              className={`text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                folder === f.key && !labelId
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{f.icon}</span>{f.label}
            </button>
          ))}

          <div className="mt-4 flex items-center justify-between px-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Labels</div>
            <button onClick={createLabel} className="text-xs text-indigo-600 hover:underline">+ new</button>
          </div>
          {labels.map((l) => (
            <button
              key={l.id}
              onClick={() => { setLabelId(l.id); setSelectedId(null); }}
              className={`text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                labelId === l.id ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: l.color ?? "#64748b" }} />
              {l.name}
            </button>
          ))}
        </aside>

        {/* List */}
        <section className="w-96 border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-white dark:bg-slate-900">
          {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
          {!loading && emails.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">
              {searchMode ? "No results." : "Nothing here."}
            </div>
          )}
          {emails.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                selectedId === e.id ? "bg-indigo-50 dark:bg-indigo-950" : ""
              } ${!e.isRead ? "font-medium" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  onClick={(ev) => { ev.stopPropagation(); void toggleStar(e); }}
                  className={`cursor-pointer text-lg ${e.isStarred ? "text-amber-500" : "text-slate-300"}`}
                  role="button"
                  aria-label="Star"
                >★</span>
                <div className="flex-1 truncate text-sm">
                  {e.from.name || e.from.email}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(e.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-0.5 text-sm truncate">
                {e.subject || "(no subject)"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.snippet}</div>
              {e.labels && e.labels.length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {e.labels.map((l) => (
                    <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (l.color ?? "#64748b") + "22", color: l.color ?? "#64748b" }}>
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </section>

        {/* Reader */}
        <section className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Select a message
            </div>
          )}
          {selected && (
            <div className="max-w-3xl mx-auto p-6">
              <div className="flex items-start gap-2">
                <h1 className="text-xl font-semibold flex-1">{selected.subject || "(no subject)"}</h1>
                <button onClick={() => openReply(false)} className="px-2.5 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700">Reply</button>
                <button onClick={() => openReply(true)} className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300">Reply all</button>
                <button onClick={openForward} className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300">Forward</button>
                <button onClick={() => deleteEmail(selected.id)} className="px-2.5 py-1 text-xs rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200">
                  {selected.folder === "TRASH" ? "Delete forever" : "Trash"}
                </button>
              </div>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                <div><span className="font-medium">From:</span> {selected.from.name ? `${selected.from.name} <${selected.from.email}>` : selected.from.email}</div>
                <div><span className="font-medium">To:</span> {Array.isArray(selected.to) ? (selected.to as { email: string }[]).map((a) => a.email).join(", ") : ""}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-relaxed">{selected.bodyText}</pre>
              {selected.attachments.length > 0 && (
                <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Attachments</div>
                  <ul className="flex flex-wrap gap-2">
                    {selected.attachments.map((a) => (
                      <li key={a.id}>
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                          📎 {a.filename} <span className="text-xs text-slate-400">({Math.ceil(a.sizeBytes / 1024)} KB)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <button onClick={() => moveToFolder(selected.id, selected.folder === "SPAM" ? "INBOX" : "SPAM")} className="hover:text-indigo-600">
                  {selected.folder === "SPAM" ? "Not spam" : "Mark spam"}
                </button>
                <span>·</span>
                <button onClick={() => patchEmail(selected.id, { isRead: false })} className="hover:text-indigo-600">Mark unread</button>
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
      {/* avoid unused var warnings */}
      <span className="hidden">{qs}</span>
    </div>
  );
}
