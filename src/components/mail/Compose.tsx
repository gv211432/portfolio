"use client";

/**
 * Compose — modal form for composing/replying. Posts to /api/mail/send.
 * Surfaces policy-block responses with the list of blocked recipients.
 * Uses react-quill-new for rich text editing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  X, Send, ChevronDown, ChevronUp, AlertTriangle, Users, History,
} from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

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

interface ContactSuggestion {
  email: string;
  name?: string;
  source: "directory" | "history";
}

function parseList(s: string): Addr[] {
  return s
    .split(/[,\n;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "color", "background", "list", "indent", "align",
  "blockquote", "code-block", "link", "image",
];

export default function Compose({ me, asStaffId, initial, onClose }: Props) {
  const [to, setTo] = useState((initial?.to ?? []).map((a) => a.email).join(", "));
  const [cc, setCc] = useState((initial?.cc ?? []).map((a) => a.email).join(", "));
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [htmlBody, setHtmlBody] = useState(
    initial?.bodyText
      ? `<pre style="font-family:sans-serif;white-space:pre-wrap">${initial.bodyText.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`
      : ""
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[] | null>(null);

  // Contact autocomplete for To field
  const [toSuggestions, setToSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const trimmed = q.trim();
    // Get the last segment after comma
    const parts = trimmed.split(/[,;]/);
    const last = (parts[parts.length - 1] ?? "").trim();
    if (last.length < 2) { setToSuggestions([]); return; }

    suggestTimer.current = setTimeout(async () => {
      try {
        const url = asStaffId
          ? `/api/mail/contacts?q=${encodeURIComponent(last)}&limit=6&asStaffId=${asStaffId}`
          : `/api/mail/contacts?q=${encodeURIComponent(last)}&limit=6`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setToSuggestions(data.contacts ?? []);
          setShowSuggestions(true);
        }
      } catch { /* ignore */ }
    }, 200);
  }, [asStaffId]);

  function applySuggestion(email: string) {
    const parts = to.split(/[,;]/);
    parts[parts.length - 1] = " " + email;
    setTo(parts.join(",") + ", ");
    setShowSuggestions(false);
    toInputRef.current?.focus();
  }

  // Extract plain text from HTML for sending
  function htmlToPlainText(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

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
          bodyText: htmlToPlainText(htmlBody),
          html: htmlBody,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => onClose(false)}>
      <div
        className="w-full sm:max-w-2xl lg:max-w-3xl bg-white dark:bg-[#161616] sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900 dark:text-white">New Message</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              From: {me.displayName} &lt;{me.email}&gt;
              {me.isAdminView && <span className="ml-1.5 text-amber-600 font-medium">(admin)</span>}
            </div>
          </div>
          <button onClick={() => onClose(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </header>

        {/* Fields */}
        <div className="px-5 py-3 space-y-2 border-b border-gray-100 dark:border-gray-800/60">
          {/* To field with autocomplete */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-gray-400 font-medium">To</label>
              <input
                ref={toInputRef}
                value={to}
                onChange={(e) => { setTo(e.target.value); fetchSuggestions(e.target.value); }}
                onFocus={() => to.trim() && toSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Recipients (comma separated)"
                className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              />
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                Cc/Bcc {showCcBcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            {showSuggestions && toSuggestions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 left-10 right-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                {toSuggestions.map((c, i) => (
                  <button
                    key={`${c.email}-${i}`}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm"
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(c.email); }}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {(c.name || c.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.name && <span className="font-medium mr-1.5">{c.name}</span>}
                      <span className="text-gray-500 text-xs">{c.email}</span>
                    </div>
                    {c.source === "directory" ? <Users size={12} className="text-gray-400 shrink-0" /> : <History size={12} className="text-gray-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showCcBcc && (
            <>
              <ComposeField label="Cc" value={cc} onChange={setCc} />
              <ComposeField label="Bcc" value={bcc} onChange={setBcc} />
            </>
          )}

          <ComposeField label="Subject" value={subject} onChange={setSubject} />
        </div>

        {/* Rich text editor */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="compose-editor">
            <ReactQuill
              theme="snow"
              value={htmlBody}
              onChange={setHtmlBody}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="Write your message..."
              style={{ height: "100%", minHeight: "280px" }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                {error}
                {blocked && blocked.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs">
                    {blocked.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <button onClick={() => onClose(false)}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium">
            Discard
          </button>
          <button
            onClick={send}
            disabled={sending || !to.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-medium shadow-sm shadow-indigo-600/20 transition"
          >
            <Send size={15} />
            {sending ? "Sending..." : "Send"}
          </button>
        </footer>
      </div>

      {/* Quill overrides for dark mode + clean look */}
      <style jsx global>{`
        .compose-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid rgb(229 231 235) !important;
          padding: 8px 12px !important;
          background: transparent;
        }
        .dark .compose-editor .ql-toolbar {
          border-bottom-color: rgb(55 65 81) !important;
        }
        .compose-editor .ql-container {
          border: none !important;
          font-family: inherit;
          font-size: 14px;
        }
        .compose-editor .ql-editor {
          padding: 16px 20px;
          min-height: 240px;
          line-height: 1.6;
        }
        .dark .compose-editor .ql-editor {
          color: #e5e7eb;
        }
        .compose-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .dark .compose-editor .ql-editor.ql-blank::before {
          color: #4b5563;
        }
        .compose-editor .ql-toolbar .ql-stroke {
          stroke: #6b7280;
        }
        .compose-editor .ql-toolbar .ql-fill {
          fill: #6b7280;
        }
        .compose-editor .ql-toolbar .ql-picker-label {
          color: #6b7280;
        }
        .dark .compose-editor .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }
        .dark .compose-editor .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }
        .dark .compose-editor .ql-toolbar .ql-picker-label {
          color: #9ca3af;
        }
        .dark .compose-editor .ql-toolbar .ql-picker-options {
          background: #1e1e1e;
          border-color: #374151;
        }
        .compose-editor .ql-toolbar button:hover .ql-stroke,
        .compose-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #4f46e5 !important;
        }
        .compose-editor .ql-toolbar button:hover .ql-fill,
        .compose-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #4f46e5 !important;
        }
      `}</style>
    </div>
  );
}

function ComposeField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-10 text-xs text-gray-400 font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
      />
    </div>
  );
}
