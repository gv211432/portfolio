"use client";

/**
 * StaffSection — list, create, edit, reset-password, policy-override, suspend.
 * Matches the indigo/slate admin theme used across other sections.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useBreadcrumbStore } from "@/Atoms/globalAtoms";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
  recoveryEmail: string;
  role: string | null;
  employeeCode: string | null;
  joinedAt: string | null;
  dateOfBirth: string | null;
  status: "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
  mustResetPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  has2fa: boolean;
  hasOverride: boolean;
}

type Section = "list" | "create" | "detail";

export default function StaffSection() {
  const [view, setView] = useState<Section>("list");
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setCrumbs } = useBreadcrumbStore();

  useEffect(() => {
    const backToList = { label: "Staff", onClick: () => setView("list") };
    if (view === "list") {
      setCrumbs([{ label: "Staff" }]);
    } else if (view === "create") {
      setCrumbs([backToList, { label: "Add Staff" }]);
    } else if (view === "detail" && selectedId) {
      const row = rows.find((r) => r.id === selectedId);
      const name = row
        ? (row.displayName ?? `${row.firstName} ${row.lastName}`)
        : "Staff Member";
      setCrumbs([backToList, { label: name }]);
    }
  }, [view, selectedId, rows, setCrumbs]);

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL("/api/admin/staff", window.location.origin);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "20");
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString());
    const data = await res.json();
    if (res.ok) {
      setRows(data.staff);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { void load(); }, [load]);

  if (view === "create") {
    return <CreateStaff onCancel={() => setView("list")} onCreated={() => { setView("list"); void load(); }} />;
  }
  if (view === "detail" && selectedId) {
    return (
      <StaffDetail
        id={selectedId}
        onBack={() => { setView("list"); void load(); }}
        onOpenMail={(sid) => { window.location.href = `${window.location.pathname}?tab=mailbox&staffId=${sid}`; }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search name, email, code…"
          className="flex-1 max-w-md px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
        >
          + Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No staff yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950/50 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">2FA</th>
                <th className="text-left px-4 py-3 font-medium">Policy</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => { setSelectedId(r.id); setView("detail"); }}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{r.firstName} {r.lastName}</div>
                    {r.employeeCode && <div className="text-xs text-gray-400">#{r.employeeCode}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-300">{r.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.role ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.has2fa
                      ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Enabled</span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.hasOverride
                      ? <span className="text-amber-600 dark:text-amber-400 text-xs">Custom</span>
                      : <span className="text-gray-400 text-xs">Global</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {r.mustResetPassword && <span className="text-amber-500 mr-2">⚠ pending reset</span>}
                    →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "ACTIVE"
    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : status === "SUSPENDED"
    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
// Create Staff
// ---------------------------------------------------------------------------
function CreateStaff({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", displayName: "", emailLocalPart: "",
    recoveryEmail: "", phone: "", role: "", employeeCode: "",
    dateOfBirth: "", joinedAt: "", profileImageUrl: "", sendCredentialsEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setResult({ email: data.staff.email, tempPassword: data.tempPassword });
  }

  if (result) {
    return (
      <div className="max-w-xl">
        <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Staff created ✅</h2>
          <p className="text-sm text-gray-500 mb-4">
            This password is shown only once. Copy it now — we hash it on save and it cannot be retrieved later.
          </p>
          <div className="space-y-3 bg-gray-50 dark:bg-slate-950/60 rounded-lg p-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Email</div>
              <div className="font-mono text-sm text-gray-900 dark:text-white">{result.email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Temporary password</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm bg-white dark:bg-slate-800 px-3 py-2 rounded border border-gray-200 dark:border-slate-700 flex-1">
                  {result.tempPassword}
                </code>
                <button onClick={() => navigator.clipboard.writeText(result.tempPassword)}
                  className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Copy</button>
              </div>
            </div>
          </div>
          <button onClick={onCreated}
            className="mt-6 w-full py-2 rounded-lg bg-gray-900 dark:bg-slate-800 text-white text-sm font-medium hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-white mb-4">← Back</button>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Staff</h2>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name*" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Input label="Last name*" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <Input label="Display name" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} placeholder="Shown in 'From' field" />

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Email address*</label>
          <div className="flex items-center">
            <input value={form.emailLocalPart} onChange={(e) => setForm({ ...form, emailLocalPart: e.target.value.toLowerCase() })}
              placeholder="jack" required
              className="flex-1 px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white" />
            <span className="px-3 py-2 rounded-r-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-500 dark:text-slate-400 font-mono">
              @{process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "mail.gaurav.one"}
            </span>
          </div>
        </div>

        <Input label="Recovery email*" type="email" value={form.recoveryEmail}
          onChange={(v) => setForm({ ...form, recoveryEmail: v })} required
          placeholder="personal@gmail.com" />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Role / title" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <Input label="Employee code" value={form.employeeCode} onChange={(v) => setForm({ ...form, employeeCode: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
          <Input label="Joined on" type="date" value={form.joinedAt} onChange={(v) => setForm({ ...form, joinedAt: v })} />
        </div>
        <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <ImageUpload
          value={form.profileImageUrl}
          onChange={(v) => setForm({ ...form, profileImageUrl: v })}
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <input type="checkbox" checked={form.sendCredentialsEmail}
            onChange={(e) => setForm({ ...form, sendCredentialsEmail: e.target.checked })}
            className="rounded" />
          Email credentials to recovery address
        </label>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
            {loading ? "Creating…" : "Create Staff"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Input(p: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{p.label}</label>
      <input
        type={p.type ?? "text"}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        required={p.required}
        placeholder={p.placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white placeholder-gray-400"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Detail — profile edit + policy override + password reset + suspend
// ---------------------------------------------------------------------------
function StaffDetail({ id, onBack, onOpenMail }: { id: string; onBack: () => void; onOpenMail: (id: string) => void }) {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [policyInput, setPolicyInput] = useState("");
  const [useOverride, setUseOverride] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/staff/${id}`);
    const data = await res.json();
    if (res.ok) {
      setStaff(data.staff);
      const override = data.staff.allowedDomainsOverride;
      setUseOverride(override !== null);
      setPolicyInput(Array.isArray(override) ? (override as string[]).join(", ") : "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function savePolicy() {
    const domains = useOverride
      ? policyInput.split(",").map((d) => d.trim()).filter(Boolean)
      : null;
    const res = await fetch(`/api/admin/staff/${id}/policy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedDomainsOverride: domains }),
    });
    if (res.ok) { setToast("Policy updated"); void load(); }
    else { const d = await res.json(); setToast(d.error ?? "Failed"); }
    setTimeout(() => setToast(null), 3000);
  }

  async function resetPassword() {
    if (!confirm("Generate a new temporary password? This revokes all active sessions.")) return;
    const res = await fetch(`/api/admin/staff/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendEmail: true }),
    });
    const data = await res.json();
    if (res.ok) setResetResult(data.tempPassword);
  }

  async function suspend(to: "SUSPENDED" | "ACTIVE" | "OFFBOARDED") {
    if (!confirm(`Set status to ${to}?`)) return;
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    void load();
  }

  if (loading || !staff) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div className="max-w-4xl">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-white mb-4">← Back</button>

      <div className="flex items-start gap-6 mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
          {staff.firstName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{staff.firstName} {staff.lastName}</h2>
          <p className="font-mono text-sm text-gray-500 dark:text-slate-400">{staff.email}</p>
          <div className="flex gap-2 mt-2">
            <StatusPill status={staff.status} />
            {staff.mustResetPassword && <span className="text-xs text-amber-500">Must reset password</span>}
          </div>
        </div>
        <button onClick={() => onOpenMail(staff.id)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
          Open Mailbox →
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Profile</h3>
          <dl className="space-y-2 text-sm">
            <Field label="Role" v={staff.role} />
            <Field label="Employee code" v={staff.employeeCode} />
            <Field label="Recovery email" v={staff.recoveryEmail} mono />
            <Field label="Phone" v={staff.phone} />
            <Field label="DOB" v={staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : null} />
            <Field label="Joined" v={staff.joinedAt ? new Date(staff.joinedAt).toLocaleDateString() : null} />
            <Field label="Last login" v={staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : null} />
          </dl>
        </div>

        {/* 2FA card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Two-factor auth</h3>
          <ul className="text-sm space-y-2">
            {(["TOTP","EMAIL_OTP"] as const).map((m) => {
              const f = staff.twoFactor?.find((x: any) => x.method === m);
              return (
                <li key={m} className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-300">{m === "TOTP" ? "Authenticator" : "Email OTP"}</span>
                  <span className={f?.enabled ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400"}>
                    {f?.enabled ? "✓ Enabled" : "Not set"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Policy card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Outbound domain policy</h3>
          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} className="rounded" />
            <span className="text-gray-700 dark:text-slate-300">Use custom list (overrides global)</span>
          </label>
          {useOverride ? (
            <>
              <input value={policyInput} onChange={(e) => setPolicyInput(e.target.value)}
                placeholder="gaurav.one, google.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white" />
              <p className="text-xs text-gray-500 mt-2">
                Comma-separated domains. Empty = block ALL outgoing. Applies to To/Cc/Bcc.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Falls back to global policy.</p>
          )}
          <button onClick={savePolicy}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Save policy</button>
        </div>

        {/* Actions card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={resetPassword}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
              Reset password
            </button>
            {staff.status === "ACTIVE" ? (
              <button onClick={() => suspend("SUSPENDED")}
                className="px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20">
                Suspend
              </button>
            ) : staff.status === "SUSPENDED" ? (
              <button onClick={() => suspend("ACTIVE")}
                className="px-4 py-2 rounded-lg border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20">
                Reactivate
              </button>
            ) : null}
            {staff.status !== "OFFBOARDED" && (
              <button onClick={() => suspend("OFFBOARDED")}
                className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20">
                Offboard
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-gray-900 text-white text-sm shadow-xl">
          {toast}
        </div>
      )}

      {resetResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setResetResult(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">New temporary password</h3>
            <p className="text-xs text-gray-500 mb-3">Shown only once. Copy now.</p>
            <div className="flex gap-2">
              <code className="flex-1 font-mono text-sm bg-gray-50 dark:bg-slate-950 px-3 py-2 rounded border border-gray-200 dark:border-slate-700">
                {resetResult}
              </code>
              <button onClick={() => navigator.clipboard.writeText(resetResult)}
                className="px-3 py-2 text-xs rounded-lg bg-indigo-600 text-white">Copy</button>
            </div>
            <button onClick={() => setResetResult(null)}
              className="mt-4 w-full py-2 rounded-lg bg-gray-900 dark:bg-slate-800 text-white text-sm">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Upload failed"); return; }
      setPreview(data.url);
      onChange(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Profile photo</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-gray-400 text-xs text-center">No photo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload image"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="text-[11px] text-gray-400">JPEG, PNG, WebP. Max 5 MB.</p>
        </div>
      </div>
      {/* Fallback: paste URL */}
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setPreview(e.target.value); }}
        placeholder="Or paste image URL"
        className="mt-2 w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-gray-900 dark:text-white placeholder-gray-400"
      />
    </div>
  );
}

function Field({ label, v, mono }: { label: string; v: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <dt className="text-xs text-gray-500 dark:text-slate-400 shrink-0">{label}</dt>
      <dd className={`text-sm text-gray-900 dark:text-white text-right ${mono ? "font-mono" : ""}`}>{v ?? "—"}</dd>
    </div>
  );
}
