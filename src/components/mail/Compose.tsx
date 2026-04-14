"use client";

/**
 * Compose — modal form for composing/replying. Posts to /api/mail/send.
 * Surfaces policy-block responses with the list of blocked recipients.
 */

import { useState } from "react";

interface Addr { email: string; name?: string }

interface Me {
  displayName: string;
  email: string;
  isAdminView: boolean;
}

interface Props {
  me: Me;
  asStaffId?: string;
  initial?: {
    to?: Addr[];
    cc?: Addr[];
    subject?: string;
    bodyText?: string;
    inReplyTo?: string;
    references?: string[];
  };
  onClose: (sent: boolean) => void;
}

function parseList(s: string): Addr[] {
  return s
    .split(/[,\n;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

export default function Compose({ me, asStaffId, initial, onClose }: Props) {
  const [to, setTo] = useState((initial?.to ?? []).map((a) => a.email).join(", "));
  const [cc, setCc] = useState((initial?.cc ?? []).map((a) => a.email).join(", "));
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [bodyText, setBodyText] = useState(initial?.bodyText ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[] | null>(null);

  async function send() {
    setSending(true);
    setError(null);
    setBlocked(null);
    try {
      const url = asStaffId ? `/api/mail/send?asStaffId=${asStaffId}` : "/api/mail/send";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: parseList(to),
          cc: parseList(cc),
          bcc: parseList(bcc),
          subject,
          bodyText,
          inReplyTo: initial?.inReplyTo,
          references: initial?.references,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.blocked) {
          setBlocked(data.blockedRecipients ?? []);
          setError(`Blocked by ${data.source} policy. Allowed domains: ${(data.allowedDomains ?? []).join(", ") || "(none)"}`);
        } else {
          setError(data.error ?? "Send failed");
        }
        return;
      }
      onClose(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 bg-black/30" onClick={() => onClose(false)}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800">
          <div className="font-semibold">New message</div>
          <div className="flex-1" />
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </header>
        <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
          From: {me.displayName} &lt;{me.email}&gt;{me.isAdminView && <span className="ml-2 text-amber-600">(admin impersonation)</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <Field label="To" value={to} onChange={setTo} placeholder="comma separated" />
          <Field label="Cc" value={cc} onChange={setCc} />
          <Field label="Bcc" value={bcc} onChange={setBcc} />
          <Field label="Subject" value={subject} onChange={setSubject} />
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={12}
            className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-sans"
          />
          {error && (
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-sm">
              {error}
              {blocked && blocked.length > 0 && (
                <ul className="mt-1 list-disc list-inside">
                  {blocked.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <footer className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button onClick={() => onClose(false)} className="px-3 py-1.5 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button
            onClick={send}
            disabled={sending || !to.trim()}
            className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-16 text-xs text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
      />
    </div>
  );
}
