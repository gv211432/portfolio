"use client";

import { useEffect, useState, useCallback } from "react";

interface Role { id: string; name: string; color: string | null; description: string | null; isSystem: boolean }
interface UserDetail {
  id: string;
  username: string;
  displayName: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  roles: { role: { id: string; name: string; color: string | null } }[];
}

interface Props {
  userId?: string;
  onSaved: () => void;
  onCancel: () => void;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminUserForm({ userId, onSaved, onCancel }: Props) {
  const isNew = !userId;

  const [user, setUser]           = useState<UserDetail | null>(null);
  const [allRoles, setAllRoles]   = useState<Role[]>([]);
  const [username, setUsername]   = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [rolesRes, userRes] = await Promise.all([
      fetch("/api/admin/rbac/roles"),
      userId ? fetch(`/api/admin/rbac/users/${userId}`) : Promise.resolve(null),
    ]);
    if (rolesRes.ok) { const { roles } = await rolesRes.json(); setAllRoles(roles); }
    if (userRes?.ok) {
      const { user } = await userRes.json();
      setUser(user);
      setUsername(user.username);
      setDisplayName(user.displayName ?? "");
      setSelectedRoleIds(new Set(user.roles.map((r: { role: { id: string } }) => r.role.id)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function toggleRole(id: string) {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setError(""); setSaving(true);
    try {
      if (isNew) {
        if (!password) { setError("Password is required"); return; }
        const res = await fetch("/api/admin/rbac/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, displayName, password, roleIds: Array.from(selectedRoleIds) }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      } else {
        const updates: Promise<Response>[] = [
          fetch(`/api/admin/rbac/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName, ...(password ? { password } : {}) }),
          }),
          fetch(`/api/admin/rbac/users/${userId}/roles`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleIds: Array.from(selectedRoleIds) }),
          }),
        ];
        const results = await Promise.all(updates);
        for (const res of results) {
          if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
        }
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
            {isNew ? "New Admin User" : `Edit: @${user?.username}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
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
        {/* Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isNew && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Username *</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="komal" className={inputCls} />
              </div>
            )}
            <div className={isNew ? "" : "sm:col-span-2"}>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Full name shown in UI" className={inputCls} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              {isNew ? "Password *" : "New Password (leave blank to keep current)"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isNew ? "Min 8 characters" : "Enter new password to change"}
                  className={inputCls + " pr-10"}
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPw
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              <button type="button" onClick={() => setPassword(generatePassword())}
                className="px-3 py-2 text-xs border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition whitespace-nowrap">
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Role assignment */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Roles</h3>
            <span className="text-xs text-gray-500 dark:text-slate-400">{selectedRoleIds.size} selected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-700">
            {/* System roles */}
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/40 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                System Roles
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {allRoles.filter((r) => r.isSystem).map((role) => (
                  <label key={role.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.has(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color ?? "#6366f1" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">{role.name}</div>
                      {role.description && <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{role.description}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {/* Custom roles */}
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/40 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Custom Roles
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-700/50 max-h-80 overflow-y-auto">
                {allRoles.filter((r) => !r.isSystem).map((role) => (
                  <label key={role.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.has(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color ?? "#6366f1" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">{role.name}</div>
                      {role.description && <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{role.description}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
