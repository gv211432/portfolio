"use client";

/**
 * Admin Mailbox — impersonation UI. Picks a staff (via ?staffId=), renders
 * MailApp with `asStaffId` so all /api/mail/* calls go through as admin.
 * Also includes the Outbox review panel for policy-blocked messages.
 */

import { useCallback, useEffect, useState } from "react";
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

export default function MailboxSection() {
  const [view, setView] = useState<"mailbox" | "outbox">("mailbox");
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const sid = sp.get("staffId");
    if (sid) setStaffId(sid);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/staff?limit=100");
      const data = await res.json();
      const list: StaffOption[] = (data.staff ?? []).map((s: { id: string; firstName: string; lastName: string; displayName: string | null; email?: string | null }) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        displayName: s.displayName,
        email: s.email ?? null,
      }));
      setStaffList(list);
    })();
  }, []);

  useEffect(() => {
    if (!staffId) { setSelectedStaff(null); return; }
    const match = staffList.find((s) => s.id === staffId);
    if (match) setSelectedStaff(match);
  }, [staffId, staffList]);

  function pickStaff(id: string) {
    setStaffId(id);
    const sp = new URLSearchParams(window.location.search);
    sp.set("tab", "mailbox");
    sp.set("staffId", id);
    window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setView("mailbox")}
            className={`px-3 py-1.5 text-sm rounded ${view === "mailbox" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}
          >Impersonate Mailbox</button>
          <button
            onClick={() => setView("outbox")}
            className={`px-3 py-1.5 text-sm rounded ${view === "outbox" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500"}`}
          >Outbox Review</button>
        </div>
      </div>

      {view === "mailbox" && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Staff:</label>
            <select
              value={staffId ?? ""}
              onChange={(e) => pickStaff(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="">— select —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName ?? `${s.firstName} ${s.lastName}`} {s.email ? `<${s.email}>` : "(no mailbox)"}
                </option>
              ))}
            </select>
          </div>
          {!staffId && (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              Pick a staff member to read their mailbox.
            </div>
          )}
          {staffId && selectedStaff && selectedStaff.email && (
            <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <MailApp
                asStaffId={staffId}
                me={{
                  staffId,
                  displayName: selectedStaff.displayName ?? `${selectedStaff.firstName} ${selectedStaff.lastName}`,
                  email: selectedStaff.email,
                  isAdminView: true,
                }}
              />
            </div>
          )}
          {staffId && selectedStaff && !selectedStaff.email && (
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

function OutboxReview() {
  const [status, setStatus] = useState<"BLOCKED" | "RELEASED" | "DISCARDED">("BLOCKED");
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [selected, setSelected] = useState<OutboxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outbox?status=${status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  async function act(id: string, action: "release" | "reject") {
    if (!confirm(action === "release" ? "Send despite policy?" : "Reject this message?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/outbox/${id}`, {
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
            <button
              key={s}
              onClick={() => { setStatus(s); setSelected(null); }}
              className={`flex-1 px-2 py-1 text-xs rounded ${status === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >{s === "DISCARDED" ? "REJECTED" : s}</button>
          ))}
        </div>
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="p-6 text-sm text-slate-500 text-center">No items.</div>
          )}
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelected(i)}
              className={`block w-full text-left p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 ${selected?.id === i.id ? "bg-indigo-50 dark:bg-indigo-950" : ""}`}
            >
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
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Select an item
          </div>
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
                <button
                  disabled={busy}
                  onClick={() => act(selected.id, "release")}
                  className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >Release &amp; send</button>
                <button
                  disabled={busy}
                  onClick={() => act(selected.id, "reject")}
                  className="px-3 py-1.5 text-sm rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-50"
                >Reject</button>
                <button
                  onClick={() => remove(selected.id)}
                  className="ml-auto px-3 py-1.5 text-sm rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                >Delete</button>
              </div>
            )}
            {status !== "BLOCKED" && (
              <button
                onClick={() => remove(selected.id)}
                className="mt-4 px-3 py-1.5 text-sm rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              >Delete</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
