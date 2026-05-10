"use client";

import { useUrlState } from "@/hooks/useUrlState";
import AdminUsersList from "./rbac/AdminUsersList";
import RolesList from "./rbac/RolesList";
import ActionsTable from "./rbac/ActionsTable";

type RbacView = "users" | "roles" | "actions";

const TABS: { id: RbacView; label: string }[] = [
  { id: "users",   label: "Admin Users" },
  { id: "roles",   label: "Roles" },
  { id: "actions", label: "Actions" },
];

export default function RbacSection() {
  const [params, setParams] = useUrlState({ rbacView: "users" });
  const view = (["users", "roles", "actions"].includes(params.rbacView)
    ? params.rbacView : "users") as RbacView;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-1 px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ rbacView: t.id })}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              view === t.id
                ? "bg-indigo-600 text-white"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "users"   && <AdminUsersList />}
        {view === "roles"   && <RolesList />}
        {view === "actions" && <ActionsTable />}
      </div>
    </div>
  );
}
