"use client";

import { useState, useEffect } from "react";
import { CompanyProfile, PaymentProfile, InvoiceClient, CURRENCIES } from "./types";
import { useUrlState } from "@/hooks/useUrlState";

// ─── Company Profile ─────────────────────────────────────────────────────────

function CompanySection() {
  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/invoice-company-profile")
      .then((r) => r.json())
      .then(({ profile }) => { if (profile) setForm(profile); });
  }, []);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true); setError("");
    const res = await fetch("/api/admin/invoice-company-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); } else {
      const d = await res.json(); setError(d.error ?? "Save failed");
    }
  }

  const inp = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        This info appears on all generated invoices. Only editable here.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Company Name *</label>
          <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className={inp} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Address</label>
          <textarea value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} rows={3} className={`${inp} resize-none`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Email</label>
          <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Phone</label>
          <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Website</label>
          <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">GST Number</label>
          <input value={form.gstNumber ?? ""} onChange={(e) => set("gstNumber", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">PAN Number</label>
          <input value={form.panNumber ?? ""} onChange={(e) => set("panNumber", e.target.value)} className={inp} />
        </div>
      </div>
      <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-50">
        {saving ? "Saving…" : saved ? "Saved!" : "Save Company Profile"}
      </button>
    </div>
  );
}

// ─── Payment Profile Modal ───────────────────────────────────────────────────

interface PPModalProps {
  existing?: PaymentProfile;
  onClose: () => void;
  onSaved: (p: PaymentProfile) => void;
}

function PaymentProfileModal({ existing, onClose, onSaved }: PPModalProps) {
  const [form, setForm] = useState({
    label: existing?.label ?? "",
    isDefault: existing?.isDefault ?? false,
    currency: existing?.currency ?? "USD",
    branch: existing?.branch ?? "",
    accountName: existing?.accountName ?? "",
    bankName: existing?.bankName ?? "",
    accountNumber: existing?.accountNumber ?? "",
    ifscCode: existing?.ifscCode ?? "",
    swiftCode: existing?.swiftCode ?? "",
    upiId: existing?.upiId ?? "",
    paypalOther: existing?.paypalOther ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function save() {
    setSaving(true); setError("");
    const url = existing ? `/api/admin/invoice-payment-profiles/${existing.id}` : "/api/admin/invoice-payment-profiles";
    const method = existing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    onSaved(data.profile);
  }

  const inp = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">{existing ? "Edit" : "Add"} Payment Profile</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Label *</label>
            <input value={form.label} onChange={(e) => set("label", e.target.value)} className={inp} placeholder="e.g. Primary USD Account" />
          </div>
          <div className="flex items-center gap-3">
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={`${inp} flex-1`}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="rounded" />
              Default
            </label>
          </div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Bank Details (Encrypted)</p>
          {(
            [
              ["accountName", "Account Holder Name"],
              ["bankName", "Bank Name"],
              ["accountNumber", "Account Number"],
              ["ifscCode", "IFSC Code"],
              ["swiftCode", "SWIFT Code"],
              ["branch", "Branch"],
            ] as [keyof typeof form, string][]
          ).map(([field, label]) => (
            <div key={field as string}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input value={String(form[field] ?? "")} onChange={(e) => set(field as string, e.target.value)} className={inp} />
            </div>
          ))}

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Digital / Online</p>
          {(
            [
              ["upiId", "UPI ID"],
              ["paypalOther", "PayPal / Other"],
            ] as [keyof typeof form, string][]
          ).map(([field, label]) => (
            <div key={field as string}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input value={String(form[field] ?? "")} onChange={(e) => set(field as string, e.target.value)} className={inp} />
            </div>
          ))}

          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Profiles List ───────────────────────────────────────────────────

function PaymentSection() {
  const [profiles, setProfiles] = useState<PaymentProfile[]>([]);
  const [modal, setModal] = useState<"add" | PaymentProfile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/invoice-payment-profiles")
      .then((r) => r.json())
      .then(({ profiles }) => setProfiles(profiles ?? []));
  }

  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("Delete this payment profile?")) return;
    setDeleting(id); setError("");
    const res = await fetch(`/api/admin/invoice-payment-profiles/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Delete failed"); }
    setDeleting(null);
    load();
  }

  return (
    <div className="max-w-xl">
      {modal && (
        <PaymentProfileModal
          existing={typeof modal === "object" ? modal : undefined}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button onClick={() => setModal("add")} className="mb-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Profile
      </button>
      {profiles.length === 0 ? (
        <p className="text-sm text-gray-400">No payment profiles yet.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{p.label}</span>
                  <span className="text-xs text-gray-400">{p.currency}</span>
                  {p.isDefault && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">DEFAULT</span>}
                </div>
                {p.bankName && <p className="text-xs text-gray-400 mt-0.5">{p.bankName}{p.branch ? ` · ${p.branch}` : ""}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(p)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => del(p.id)} disabled={deleting === p.id} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Client Modal ─────────────────────────────────────────────────────────────

interface ClientModalProps {
  existing?: InvoiceClient;
  onClose: () => void;
  onSaved: () => void;
}

function ClientModal({ existing, onClose, onSaved }: ClientModalProps) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    address: existing?.address ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
    defaultCurrency: existing?.defaultCurrency ?? "USD",
    notes: existing?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  async function save() {
    setSaving(true); setError("");
    const url = existing ? `/api/admin/invoice-clients/${existing.id}` : "/api/admin/invoice-clients";
    const method = existing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    onSaved();
  }

  const inp = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">{existing ? "Edit" : "Add"} Client</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Address</label>
            <textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Default Currency</label>
            <select value={form.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} className={inp}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={`${inp} resize-none`} />
          </div>
          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
            {saving ? "Saving…" : "Save Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clients List ─────────────────────────────────────────────────────────────

function ClientsSection() {
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | InvoiceClient | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const limit = 20;

  function load() {
    const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) sp.set("search", search);
    fetch(`/api/admin/invoice-clients?${sp}`)
      .then((r) => r.json())
      .then(({ clients, total }) => { setClients(clients ?? []); setTotal(total ?? 0); });
  }

  useEffect(() => { load(); }, [page, search]);

  async function del(c: InvoiceClient) {
    if (!confirm(`Remove ${c.name}?`)) return;
    setDeleting(c.id); setError("");
    const res = await fetch(`/api/admin/invoice-clients/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Delete failed"); }
    setDeleting(null);
    load();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-2xl">
      {modal && (
        <ClientModal
          existing={typeof modal === "object" ? modal : undefined}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search clients…"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={() => setModal("add")} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-gray-400">No clients found.</p>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className={`flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 ${!c.isActive ? "opacity-50" : ""}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.defaultCurrency}</span>
                  {!c.isActive && <span className="text-[10px] font-bold text-gray-400">(inactive)</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {[c.email, c.phone].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal(c)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => del(c)} disabled={deleting === c.id} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-400">{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────

const SUB_TABS = [
  { id: "company", label: "Company Profile" },
  { id: "payment", label: "Payment Profiles" },
  { id: "clients", label: "Clients" },
] as const;

type SubTab = typeof SUB_TABS[number]["id"];

export default function InvoiceSettings() {
  const [params, setParams] = useUrlState({ settingsTab: "company" });
  const sub = params.settingsTab;
  const active = (SUB_TABS.find((t) => t.id === sub) ? sub : "company") as SubTab;

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex gap-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ settingsTab: t.id })}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${active === t.id ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {active === "company" && <CompanySection />}
        {active === "payment" && <PaymentSection />}
        {active === "clients" && <ClientsSection />}
      </div>
    </div>
  );
}
