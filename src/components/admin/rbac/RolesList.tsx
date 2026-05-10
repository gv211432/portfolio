"use client";

import { useEffect, useState, useCallback } from "react";
import RoleForm from "./RoleForm";

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isSystem: boolean;
  _count: { users: number; permissions: number };
}

export default function RolesList() {
  const [roles, setRoles]           = useState<Role[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null); // roleId or "new"
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [error, setError]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rbac/roles");
    if (res.ok) { const { roles } = await res.json(); setRoles(roles); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteRole(id: string, name: string) {
    if (!confirm(`Delete role "${name}"? This will remove it from all users who have it.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/rbac/roles/${id}`, { method: "DELETE" });
    if (res.ok) { setRoles((prev) => prev.filter((r) => r.id !== id)); }
    else { const d = await res.json(); setError(d.error ?? "Delete failed"); }
    setDeleting(null);
  }

  if (editingRole) {
    return (
      <RoleForm
        roleId={editingRole === "new" ? undefined : editingRole}
        onSaved={() => { setEditingRole(null); load(); }}
        onCancel={() => setEditingRole(null)}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Roles</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {roles.length} roles — system roles are protected from deletion.
          </p>
        </div>
        <button
          onClick={() => setEditingRole("new")}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Role
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: role.color ?? "#6366f1" }}
                  />
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate font-mono">
                    {role.name}
                  </span>
                </div>
                {role.isSystem && (
                  <span className="shrink-0 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    System
                  </span>
                )}
              </div>

              {role.description && (
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  {role.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-auto">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {role._count.users} users
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {role._count.permissions} actions
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => setEditingRole(role.id)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Edit Permissions
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => deleteRole(role.id, role.name)}
                    disabled={deleting === role.id}
                    className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                  >
                    {deleting === role.id ? "…" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
