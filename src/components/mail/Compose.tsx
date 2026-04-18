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
  Paperclip, FileText, Trash2,
} from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface Addr { email: string; name?: string }

interface Me {
  displayName: string;
  email: string;
  isAdminView: boolean;
}

interface ForwardAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  s3Key: string;
  url?: string;
}

interface AttachmentItem {
  file?: File;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploading: boolean;
  s3Key?: string;
  url?: string;
  error?: string;
}

interface Props {
  me: Me;
  asStaffId?: string;
  initial?: {
    draftId?: string;
    to?: Addr[];
    cc?: Addr[];
    subject?: string;
    bodyText?: string;
    bodyHtml?: string;
    inReplyTo?: string;
    references?: string[];
    forwardAttachments?: ForwardAttachment[];
  };
  onClose: (sent: boolean) => void;
}

interface ContactSuggestion {
  email: string;
  name?: string;
  designation?: string;
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

/** Address input with live contact autocomplete (To / Cc / Bcc). */
function ContactInput({
  label, value, onChange, asStaffId, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  asStaffId?: string;
  autoFocus?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(
    (raw: string) => {
      if (timer.current) clearTimeout(timer.current);
      const parts = raw.split(/[,;]/);
      const last = (parts[parts.length - 1] ?? "").trim();
      if (last.length < 1) { setSuggestions([]); return; }

      timer.current = setTimeout(async () => {
        try {
          const url = asStaffId
            ? `/api/mail/contacts?q=${encodeURIComponent(last)}&limit=7&asStaffId=${asStaffId}`
            : `/api/mail/contacts?q=${encodeURIComponent(last)}&limit=7`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.contacts ?? []);
            setOpen(true);
          }
        } catch { /* ignore */ }
      }, 150);
    },
    [asStaffId],
  );

  function applySuggestion(email: string) {
    const parts = value.split(/[,;]/);
    parts[parts.length - 1] = " " + email;
    onChange(parts.join(",") + ", ");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex items-center gap-2">
      <label className="w-10 text-xs text-gray-400 font-medium shrink-0">{label}</label>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
        onFocus={() => value.trim() && suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Recipients (comma separated)"
        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-10 right-0 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((c, i) => (
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
                {c.designation && (
                  <span className="block text-[11px] text-gray-400 dark:text-gray-500 truncate">{c.designation}</span>
                )}
              </div>
              {c.source === "directory"
                ? <Users size={12} className="text-gray-400 shrink-0" />
                : <History size={12} className="text-gray-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compose({ me, asStaffId, initial, onClose }: Props) {
  const [to, setTo] = useState((initial?.to ?? []).map((a) => a.email).join(", "));
  const [cc, setCc] = useState((initial?.cc ?? []).map((a) => a.email).join(", "));
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(!!(initial?.cc?.length));
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [htmlBody, setHtmlBody] = useState(
    initial?.bodyHtml
      ? initial.bodyHtml
      : initial?.bodyText
      ? `<pre style="font-family:sans-serif;white-space:pre-wrap">${initial.bodyText.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`
      : ""
  );
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() =>
    (initial?.forwardAttachments ?? []).map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      sizeBytes: a.sizeBytes,
      uploading: false,
      s3Key: a.s3Key,
      url: a.url,
    }))
  );
  const attachRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[] | null>(null);

  // Auto-draft
  const draftIdRef = useRef<string | null>(initial?.draftId ?? null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Create a blank draft immediately on mount (if not resuming an existing one)
  useEffect(() => {
    if (draftIdRef.current) return;
    const url = asStaffId ? `/api/mail/drafts?asStaffId=${asStaffId}` : "/api/mail/drafts";
    fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((d) => { if (d.draft?.id) draftIdRef.current = d.draft.id; })
      .catch(console.error);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function currentDraftPayload() {
    return {
      to: parseList(to),
      cc: parseList(cc),
      bcc: parseList(bcc),
      subject,
      bodyHtml: htmlBody,
      bodyText: htmlToPlainText(htmlBody),
    };
  }

  async function doSave() {
    const id = draftIdRef.current;
    if (!id) return;
    setSaveStatus("saving");
    try {
      const url = asStaffId ? `/api/mail/drafts/${id}?asStaffId=${asStaffId}` : `/api/mail/drafts/${id}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(currentDraftPayload()),
      });
      setSaveStatus("saved");
    } catch { setSaveStatus("idle"); }
  }

  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("idle");
    autoSaveTimer.current = setTimeout(() => void doSave(), 2000);
  }

  async function deleteDraft() {
    const id = draftIdRef.current;
    if (!id) return;
    const url = asStaffId ? `/api/mail/drafts/${id}?asStaffId=${asStaffId}` : `/api/mail/drafts/${id}`;
    await fetch(url, { method: "DELETE" }).catch(console.error);
  }

  async function handleClose() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await doSave();
    onClose(false);
  }

  async function handleDiscard() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await deleteDraft();
    onClose(false);
  }

  function htmlToPlainText(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  async function addFiles(files: FileList) {
    const newAtts: AttachmentItem[] = Array.from(files).map((file) => ({
      file,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newAtts]);

    for (const att of newAtts) {
      try {
        const form = new FormData();
        form.append("file", att.file!);
        const uploadUrl = asStaffId
          ? `/api/mail/attachments/upload?asStaffId=${asStaffId}`
          : "/api/mail/attachments/upload";
        const res = await fetch(uploadUrl, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setAttachments((prev) => prev.map((a) =>
          a.file === att.file ? { ...a, uploading: false, s3Key: data.key, url: data.url } : a
        ));
      } catch (err) {
        setAttachments((prev) => prev.map((a) =>
          a.file === att.file ? { ...a, uploading: false, error: (err as Error).message } : a
        ));
      }
    }
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
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
          bodyHtml: htmlBody,
          inReplyTo: initial?.inReplyTo,
          references: initial?.references,
          attachments: attachments
            .filter((a) => a.s3Key)
            .map((a) => ({
              filename: a.filename,
              contentType: a.contentType,
              sizeBytes: a.sizeBytes,
              s3Key: a.s3Key,
            })),
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
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      await deleteDraft();
      onClose(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm" onClick={() => void handleClose()}>
      <div
        className="w-full sm:max-w-2xl lg:max-w-3xl bg-white dark:bg-[#161616] sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white">
              {initial?.draftId ? "Edit Draft" : "New Message"}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
              <span>From: {me.displayName} &lt;{me.email}&gt;</span>
              {me.isAdminView && <span className="text-amber-600 font-medium">(admin)</span>}
              {saveStatus === "saving" && <span className="text-gray-400 italic">Saving…</span>}
              {saveStatus === "saved" && <span className="text-green-600 dark:text-green-400">Saved</span>}
            </div>
          </div>
          <button onClick={() => void handleClose()} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </header>

        {/* Fields */}
        <div className="px-5 py-3 space-y-2 border-b border-gray-100 dark:border-gray-800/60">
          {/* To field */}
          <div className="flex items-start gap-0">
            <div className="flex-1">
              <ContactInput label="To" value={to} onChange={(v) => { setTo(v); scheduleAutoSave(); }} asStaffId={asStaffId} autoFocus />
            </div>
            <button
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 mt-1.5 shrink-0"
            >
              Cc/Bcc {showCcBcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showCcBcc && (
            <>
              <ContactInput label="Cc" value={cc} onChange={(v) => { setCc(v); scheduleAutoSave(); }} asStaffId={asStaffId} />
              <ContactInput label="Bcc" value={bcc} onChange={(v) => { setBcc(v); scheduleAutoSave(); }} asStaffId={asStaffId} />
            </>
          )}

          <div className="flex items-center gap-2">
            <label className="w-10 text-xs text-gray-400 font-medium shrink-0">Subject</label>
            <input
              value={subject}
              onChange={(e) => { setSubject(e.target.value); scheduleAutoSave(); }}
              className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Rich text editor */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="compose-editor">
            <ReactQuill
              theme="snow"
              value={htmlBody}
              onChange={(v) => { setHtmlBody(v); scheduleAutoSave(); }}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="Write your message..."
              style={{ height: "100%", minHeight: "280px" }}
            />
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-800/60 space-y-1.5">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span className="truncate flex-1">{a.filename}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {a.uploading ? "Uploading..." : a.error ? <span className="text-red-500">{a.error}</span> : formatSize(a.sizeBytes)}
                </span>
                {a.uploading && <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />}
                <button onClick={() => removeAttachment(i)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded shrink-0">
                  <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={attachRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />

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
        <footer className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <button onClick={() => void handleDiscard()}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition font-medium">
            Discard
          </button>
          <button
            type="button"
            onClick={() => attachRef.current?.click()}
            className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Attach files"
          >
            <Paperclip size={18} />
          </button>
          <div className="flex-1" />
          <button
            onClick={send}
            disabled={sending || !to.trim() || attachments.some((a) => a.uploading)}
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
          background: #ffffff !important;
          color-scheme: light;
        }
        .compose-editor .ql-editor {
          padding: 16px 20px;
          min-height: 240px;
          line-height: 1.6;
          background: #ffffff !important;
          color: #111827 !important;
          color-scheme: light;
        }
        .dark .compose-editor .ql-container {
          background: transparent !important;
          color-scheme: dark;
        }
        .dark .compose-editor .ql-editor {
          background: transparent !important;
          color: #e5e7eb !important;
          color-scheme: dark;
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

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.ceil(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
