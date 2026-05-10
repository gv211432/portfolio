"use client";

import { useEffect, useState, useCallback } from "react";

interface ActionRow {
  id: string;
  method: string;
  path: string;
  section: string;
  label: string;
  isReadOnly: boolean;
  isEnabled: boolean;
  isSystem: boolean;
  _count: { permissions: number };
}

const DEADLOCK_PROTECTED = new Set([
  "rbac.actions.toggle", "auth.login", "auth.logout",
  "auth.session", "auth.totp.setup", "auth.totp.verify",
]);

const METHOD_COLOR: Record<string, string> = {
  GET:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  POST:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PATCH:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PUT:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SECTION_LABELS: Record<string, string> = {
  system: "System", dashboard: "Dashboard", activity: "Activity Log",
  contacts: "Contacts", careers: "Careers", chats: "Chats", ngo: "NGO",
  notifications: "Notifications", staff: "Staff", mail_policy: "Mail Policy",
  mailbox: "Mailbox", database: "Database", invoice: "Invoice", rbac: "RBAC",
};

export default function ActionsTable() {
  const [grouped, setGrouped] = useState<Record<string, ActionRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["system"]));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rbac/actions");
    if (res.ok) {
      const { actions } = await res.json();
      setGrouped(actions);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(actionId: string, current: boolean) {
    if (DEADLOCK_PROTECTED.has(actionId)) return;
    setToggling(actionId);
    const res = await fetch(`/api/admin/rbac/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !current }),
    });
    if (res.ok) {
      setGrouped((prev) => {
        const next = { ...prev };
        for (const sec of Object.keys(next)) {
          next[sec] = next[sec].map((a) =>
            a.id === actionId ? { ...a, isEnabled: !current } : a
          );
        }
        return next;
      });
    }
    setToggling(null);
  }

  function toggleSection(sec: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(sec) ? next.delete(sec) : next.add(sec);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = Object.keys(grouped);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Actions</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Disable an action to block it globally for all non-SUPER_MANAGER users.
          </p>
        </div>
      </div>

      {sections.map((sec) => {
        const actions = grouped[sec];
        const isCollapsed = collapsed.has(sec);
        const enabledCount = actions.filter((a) => a.isEnabled).length;

        return (
          <div key={sec} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSection(sec)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {SECTION_LABELS[sec] ?? sec}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {enabledCount}/{actions.length} enabled
                </span>
              </div>
              {sec === "system" && (
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  Always on
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div className="border-t border-gray-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 w-8">Method</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400">Label</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hidden md:table-cell">Path</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 hidden sm:table-cell">Roles</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {actions.map((action) => {
                      const isProtected = DEADLOCK_PROTECTED.has(action.id) || action.isSystem;
                      const isTogglingThis = toggling === action.id;
                      return (
                        <tr key={action.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition ${!action.isEnabled ? "opacity-50" : ""}`}>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold ${METHOD_COLOR[action.method] ?? ""}`}>
                              {action.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-gray-900 dark:text-white font-medium">{action.label}</span>
                            <span className="ml-2 text-xs font-mono text-gray-400 dark:text-slate-500 hidden lg:inline">{action.id}</span>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <span className="text-xs font-mono text-gray-500 dark:text-slate-400">{action.path}</span>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500 dark:text-slate-400">
                            {action._count.permissions}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {isProtected ? (
                              <span className="text-xs text-gray-400 dark:text-slate-500 italic">Protected</span>
                            ) : (
                              <button
                                onClick={() => toggle(action.id, action.isEnabled)}
                                disabled={isTogglingThis}
                                title={action.isEnabled ? "Disable this action" : "Enable this action"}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                  action.isEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"
                                } ${isTogglingThis ? "opacity-50" : ""}`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                    action.isEnabled ? "translate-x-4" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
