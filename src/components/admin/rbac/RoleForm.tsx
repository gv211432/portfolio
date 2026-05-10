"use client";

import { useEffect, useState, useCallback } from "react";

interface ActionRow {
  id: string;
  method: string;
  label: string;
  section: string;
  isReadOnly: boolean;
  isSystem: boolean;
}

interface RoleFull {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isSystem: boolean;
  permissions: { actionId: string }[];
}

interface Props {
  roleId?: string;
  onSaved: () => void;
  onCancel: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  system: "System", dashboard: "Dashboard", activity: "Activity Log",
  contacts: "Contacts", careers: "Careers", chats: "Chats", ngo: "NGO",
  notifications: "Notifications", staff: "Staff", mail_policy: "Mail Policy",
  mailbox: "Mailbox", database: "Database", invoice: "Invoice", rbac: "RBAC",
};

const METHOD_COLOR: Record<string, string> = {
  GET:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  POST:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PATCH:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PUT:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRESET_COLORS = [
  "#6366f1","#dc2626","#059669","#d97706","#0891b2",
  "#7c3aed","#be123c","#0369a1","#065f46","#1d4ed8",
];

export default function RoleForm({ roleId, onSaved, onCancel }: Props) {
  const isNew = !roleId;

  const [role, setRole]             = useState<RoleFull | null>(null);
  const [allActions, setAllActions] = useState<Record<string, ActionRow[]>>({});
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor]           = useState(PRESET_COLORS[0]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [dirty, setDirty]           = useState(false);

  const loadActions = useCallback(async () => {
    const res = await fetch("/api/admin/rbac/actions");
    if (res.ok) { const { actions } = await res.json(); setAllActions(actions); }
  }, []);

  const loadRole = useCallback(async () => {
    if (!roleId) return;
    const res = await fetch(`/api/admin/rbac/roles/${roleId}`);
    if (res.ok) {
      const { role } = await res.json();
      setRole(role);
      setName(role.name);
      setDescription(role.description ?? "");
      setColor(role.color ?? PRESET_COLORS[0]);
      setSelected(new Set(role.permissions.map((p: { actionId: string }) => p.actionId)));
    }
  }, [roleId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadActions(), loadRole()]).finally(() => setLoading(false));
  }, [loadActions, loadRole]);

  function toggleAction(id: string) {
    setDirty(true);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSection(section: string, actions: ActionRow[]) {
    setDirty(true);
    const ids = actions.filter((a) => !a.isSystem).map((a) => a.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  }

  async function save() {
    setError(""); setSaving(true);
    try {
      if (isNew) {
        const res = await fetch("/api/admin/rbac/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, color, actionIds: Array.from(selected) }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      } else {
        const [metaRes, permRes] = await Promise.all([
          fetch(`/api/admin/rbac/roles/${roleId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, color }),
          }),
          fetch(`/api/admin/rbac/roles/${roleId}/permissions`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ actionIds: Array.from(selected) }),
          }),
        ]);
        if (!metaRes.ok || !permRes.ok) { setError("Save failed"); return; }
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = Object.keys(allActions).filter((s) => s !== "system");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isNew ? "New Role" : `Edit: ${role?.name}`}
          </h2>
          {dirty && <span className="w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">{selected.size} actions selected</span>
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Meta */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Role Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isNew && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="MY_ROLE" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Auto-uppercased, spaces → underscores.</p>
              </div>
            )}
            <div className={isNew ? "" : "sm:col-span-2"}>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role can do" className={inputCls} />
            </div>
          </div>
          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-gray-300 dark:border-slate-600"
                title="Custom color"
              />
              <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">{color}</span>
            </div>
          </div>
        </div>

        {/* Permission matrix */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Permissions</h3>
            <div className="flex gap-2">
              <button
                onClick={() => { setDirty(true); setSelected(new Set(sections.flatMap((s) => (allActions[s] ?? []).filter((a) => !a.isSystem).map((a) => a.id)))); }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <button
                onClick={() => { setDirty(true); setSelected(new Set()); }}
                className="text-xs text-gray-500 dark:text-slate-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {sections.map((sec) => {
              const actions = allActions[sec].filter((a) => !a.isSystem);
              if (!actions.length) return null;
              const sectionIds = actions.map((a) => a.id);
              const allChecked = sectionIds.every((id) => selected.has(id));
              const someChecked = sectionIds.some((id) => selected.has(id));

              return (
                <div key={sec}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-700/40">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={() => toggleSection(sec, actions)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                        {SECTION_LABELS[sec] ?? sec}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {sectionIds.filter((id) => selected.has(id)).length}/{sectionIds.length}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50 dark:divide-slate-700/50">
                    {actions.map((action) => (
                      <label key={action.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.has(action.id)}
                          onChange={() => toggleAction(action.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${METHOD_COLOR[action.method] ?? ""}`}>
                          {action.method}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{action.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
