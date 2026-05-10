"use client";

/**
 * Admin Mailbox — impersonation UI. Picks a staff via fuzzy-search combobox,
 * renders MailApp with `asStaffId` so all /api/mail/* calls go through as admin.
 * Also includes the Outbox review panel for policy-blocked messages.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import MailApp from "@/components/mail/MailApp";

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
}

interface OutboxItem {
  id: string;
  createdAt: string;
  fromEmail: string;
  subject: string | null;
  status: string;
  reason: string | null;
  blockedRecipients: unknown;
  bodyText: string;
  toJson: unknown;
  staff: { id: string; firstName: string; lastName: string; displayName: string | null };
}

// ---------------------------------------------------------------------------
// Staff search combobox
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10;

function StaffCombobox({
  selected,
  onSelect,
}: {
  selected: StaffOption | null;
  onSelect: (staff: StaffOption | null) => void;
}) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<StaffOption[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function doSearch(q: string, pg: number) {
    setLoading(true);
    const url = new URL("/api/admin/staff", window.location.origin);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("page", String(pg));
    if (q.trim()) url.searchParams.set("search", q.trim());
    const res  = await fetch(url.toString());
    const data = await res.json();
    if (res.ok) {
      setResults((data.staff ?? []).map((s: StaffOption & { email?: string | null }) => ({
        id: s.id, firstName: s.firstName, lastName: s.lastName,
        displayName: s.displayName, email: s.email ?? null,
      })));
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }

  function handleFocus() {
    setFocused(true);
    setQuery("");
    setPage(1);
    doSearch("", 1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q, 1), 280);
  }

  function handleSelect(staff: StaffOption) {
    onSelect(staff);
    setFocused(false);
    setQuery("");
  }

  function handleBlur(e: React.FocusEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setFocused(false);
      setQuery("");
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect(null);
    setQuery("");
    setFocused(false);
  }

  function goPage(pg: number) {
    setPage(pg);
    doSearch(query, pg);
  }

  const displayValue = focused
    ? query
    : (selected ? (selected.displayName ?? `${selected.firstName} ${selected.lastName}`) : "");

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-sm w-80 transition ${
        focused
          ? "border-indigo-500 ring-1 ring-indigo-500/30"
          : "border-slate-300 dark:border-slate-700"
      }`}>
        {/* Search icon */}
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Search staff by name or email…"
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm min-w-0"
        />

        {/* Clear × when selected and not focused */}
        {selected && !focused ? (
          <button
            onMouseDown={handleClear}
            tabIndex={-1}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {focused && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Results list */}
          <div className="max-h-[240px] overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                Searching…
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400">No staff found.</div>
            )}
            {!loading && results.map((s) => (
              <button
                key={s.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition ${
                  selected?.id === s.id ? "bg-indigo-50 dark:bg-indigo-950/40" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                  {(s.displayName ?? s.firstName).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {s.displayName ?? `${s.firstName} ${s.lastName}`}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {s.email ?? "no mailbox"}
                  </div>
                </div>
                {selected?.id === s.id && (
                  <svg className="w-4 h-4 text-indigo-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Pagination footer — only shown when more than one page */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <span className="text-xs text-slate-400">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onMouseDown={(e) => { e.preventDefault(); goPage(page - 1); }}
                  disabled={page === 1}
                  className="px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >‹ Prev</button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); goPage(page + 1); }}
                  disabled={page >= totalPages}
                  className="px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >Next ›</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------
export default function MailboxSection() {
  const [view, setView]                 = useState<"mailbox" | "outbox">("mailbox");
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);

  // Restore staff from URL on mount
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("staffId");
    if (!sid) return;
    fetch(`/api/admin/staff/${sid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.staff) {
          const s = d.staff;
          setSelectedStaff({
            id: s.id, firstName: s.firstName, lastName: s.lastName,
            displayName: s.displayName ?? null, email: s.email ?? null,
          });
        }
      })
      .catch(() => null);
  }, []);

  function handleSelect(staff: StaffOption | null) {
    setSelectedStaff(staff);
    const sp = new URLSearchParams(window.location.search);
    sp.set("tab", "mailbox");
    if (staff) sp.set("staffId", staff.id);
    else sp.delete("staffId");
    window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setView("mailbox")}
            className={`px-3 py-1.5 text-sm rounded transition ${view === "mailbox" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}
          >Impersonate Mailbox</button>
          <button
            onClick={() => setView("outbox")}
            className={`px-3 py-1.5 text-sm rounded transition ${view === "outbox" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}
          >Outbox Review</button>
        </div>
      </div>

      {view === "mailbox" && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 shrink-0">Staff:</label>
            <StaffCombobox selected={selectedStaff} onSelect={handleSelect} />
          </div>

          {!selectedStaff && (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              Search and pick a staff member to read their mailbox.
            </div>
          )}
          {selectedStaff?.email && (
            <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <MailApp
                asStaffId={selectedStaff.id}
                me={{
                  staffId: selectedStaff.id,
                  displayName: selectedStaff.displayName ?? `${selectedStaff.firstName} ${selectedStaff.lastName}`,
                  email: selectedStaff.email,
                  isAdminView: true,
                }}
              />
            </div>
          )}
          {selectedStaff && !selectedStaff.email && (
            <div className="p-8 text-center text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-lg">
              This staff member has no mailbox assigned.
            </div>
          )}
        </>
      )}

      {view === "outbox" && <OutboxReview />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outbox review (unchanged)
// ---------------------------------------------------------------------------
function OutboxReview() {
  const [status, setStatus]   = useState<"BLOCKED" | "RELEASED" | "DISCARDED">("BLOCKED");
  const [items, setItems]     = useState<OutboxItem[]>([]);
  const [selected, setSelected] = useState<OutboxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy]       = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/outbox?status=${status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  async function act(id: string, action: "release" | "reject") {
    if (!confirm(action === "release" ? "Send despite policy?" : "Reject this message?")) return;
    setBusy(true);
    try {
      const res  = await fetch(`/api/admin/outbox/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed"); return; }
      setSelected(null);
      void fetchItems();
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete?")) return;
    await fetch(`/api/admin/outbox/${id}`, { method: "DELETE" });
    setSelected(null);
    void fetchItems();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex gap-1">
          {(["BLOCKED", "RELEASED", "DISCARDED"] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setSelected(null); }}
              className={`flex-1 px-2 py-1 text-xs rounded ${status === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              {s === "DISCARDED" ? "REJECTED" : s}
            </button>
          ))}
        </div>
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">No items.</div>
          )}
          {items.map((i) => (
            <button key={i.id} onClick={() => setSelected(i)}
              className={`block w-full text-left p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${selected?.id === i.id ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}>
              <div className="text-xs text-slate-500">{new Date(i.createdAt).toLocaleString()}</div>
              <div className="text-sm font-medium truncate">{i.subject || "(no subject)"}</div>
              <div className="text-xs text-slate-500 truncate">from {i.fromEmail}</div>
              <div className="text-xs text-rose-600 mt-0.5 truncate">{i.reason}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 min-h-[400px]">
        {!selected && (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Select an item</div>
        )}
        {selected && (
          <>
            <h2 className="text-lg font-semibold">{selected.subject || "(no subject)"}</h2>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
              <div><span className="font-medium">From:</span> {selected.fromEmail}</div>
              <div><span className="font-medium">To:</span> {Array.isArray(selected.toJson) ? (selected.toJson as { email: string }[]).map((a) => a.email).join(", ") : ""}</div>
              <div className="text-rose-600"><span className="font-medium">Reason:</span> {selected.reason}</div>
              {Array.isArray(selected.blockedRecipients) && selected.blockedRecipients.length > 0 && (
                <div><span className="font-medium">Blocked:</span> {(selected.blockedRecipients as string[]).join(", ")}</div>
              )}
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded">{selected.bodyText}</pre>
            {status === "BLOCKED" && (
              <div className="mt-4 flex gap-2">
                <button disabled={busy} onClick={() => act(selected.id, "release")}
                  className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                  Release &amp; send
                </button>
                <button disabled={busy} onClick={() => act(selected.id, "reject")}
                  className="px-3 py-1.5 text-sm rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-50">
                  Reject
                </button>
                <button onClick={() => remove(selected.id)}
                  className="ml-auto px-3 py-1.5 text-sm rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                  Delete
                </button>
              </div>
            )}
            {status !== "BLOCKED" && (
              <button onClick={() => remove(selected.id)}
                className="mt-4 px-3 py-1.5 text-sm rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
