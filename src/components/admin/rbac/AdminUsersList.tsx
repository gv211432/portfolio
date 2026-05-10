"use client";

import { useEffect, useState, useCallback } from "react";
import { useBreadcrumbStore } from "@/Atoms/globalAtoms";
import AdminUserForm from "./AdminUserForm";
import AdminUserActivityLog from "./AdminUserActivityLog";

interface UserRole {
  role: { id: string; name: string; color: string | null };
  assignedAt: string;
}

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totpEnabled: boolean;
  roles: UserRole[];
}

type Panel = { type: "form"; userId?: string } | { type: "activity"; userId: string; username: string } | null;

function formatRelative(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminUsersList() {
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"active"|"inactive">("all");
  const [loading, setLoading] = useState(true);
  const [panel, setPanel]   = useState<Panel>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const { setCrumbs } = useBreadcrumbStore();

  useEffect(() => {
    const backToList = { label: "Admin Users", onClick: () => setPanel(null) };
    if (!panel) {
      setCrumbs([{ label: "RBAC" }, { label: "Admin Users" }]);
    } else if (panel.type === "form" && !panel.userId) {
      setCrumbs([{ label: "RBAC" }, backToList, { label: "New User" }]);
    } else if (panel.type === "form" && panel.userId) {
      const user = users.find((u) => u.id === panel.userId);
      setCrumbs([{ label: "RBAC" }, backToList, { label: user?.username ?? "Edit User" }]);
    } else if (panel.type === "activity") {
      setCrumbs([{ label: "RBAC" }, backToList, { label: `${panel.username} — Activity` }]);
    }
  }, [panel, users, setCrumbs]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filter !== "all") params.set("active", filter === "active" ? "true" : "false");
    const res = await fetch(`/api/admin/rbac/users?${params}`);
    if (res.ok) { const { users, total } = await res.json(); setUsers(users); setTotal(total); }
    setLoading(false);
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(user: AdminUser) {
    setToggling(user.id);
    const res = await fetch(`/api/admin/rbac/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) {
      const { user: updated } = await res.json();
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed");
    }
    setToggling(null);
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Permanently delete admin "${user.username}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/rbac/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const d = await res.json();
      alert(d.error ?? "Delete failed");
    }
  }

  if (panel?.type === "form") {
    return (
      <AdminUserForm
        userId={panel.userId}
        onSaved={() => { setPanel(null); load(); }}
        onCancel={() => setPanel(null)}
      />
    );
  }

  if (panel?.type === "activity") {
    return (
      <AdminUserActivityLog
        userId={panel.userId}
        username={panel.username}
        onBack={() => setPanel(null)}
      />
    );
  }

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users…"
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value as "all"|"active"|"inactive"); setPage(1); }}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setPanel({ type: "form" })}
          className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New User
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">No admin users found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden md:table">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">Roles</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">2FA</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">Last Login</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.displayName ?? user.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 3).map((ur) => (
                          <span
                            key={ur.role.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: ur.role.color ?? "#6366f1" }}
                          >
                            {ur.role.name}
                          </span>
                        ))}
                        {user.roles.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            +{user.roles.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.totpEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.totpEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                        {user.totpEnabled ? "On" : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                      {formatRelative(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPanel({ type: "form", userId: user.id })}
                          title="Edit"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPanel({ type: "activity", userId: user.id, username: user.username })}
                          title="Activity log"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={toggling === user.id}
                          title={user.isActive ? "Deactivate" : "Activate"}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition disabled:opacity-50 ${
                            user.isActive ? "text-amber-500 hover:text-amber-600" : "text-emerald-500 hover:text-emerald-600"
                          }`}
                        >
                          {user.isActive ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                        {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{user.displayName ?? user.username}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">@{user.username}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((ur) => (
                      <span key={ur.role.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: ur.role.color ?? "#6366f1" }}>
                        {ur.role.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPanel({ type: "form", userId: user.id })} className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">Edit</button>
                    <button onClick={() => setPanel({ type: "activity", userId: user.id, username: user.username })} className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">Logs</button>
                    <button onClick={() => toggleActive(user)} disabled={toggling === user.id}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <span className="text-xs text-gray-500 dark:text-slate-400">{total} users</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded disabled:opacity-40 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-2 py-1 text-xs border rounded transition ${
                  p === page ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded disabled:opacity-40 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
