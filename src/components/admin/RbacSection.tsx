"use client";

import { useEffect } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/Atoms/globalAtoms";
import AdminUsersList from "./rbac/AdminUsersList";
import RolesList from "./rbac/RolesList";
import ActionsTable from "./rbac/ActionsTable";

type RbacView = "users" | "roles" | "actions";

const TABS: { id: RbacView; label: string }[] = [
  { id: "users",   label: "Admin Users" },
  { id: "roles",   label: "Roles" },
  { id: "actions", label: "Actions" },
];

const TAB_LABELS: Record<RbacView, string> = {
  users: "Admin Users", roles: "Roles", actions: "Actions",
};

export default function RbacSection() {
  const [params, setParams] = useUrlState({ rbacView: "users" });
  const view = (["users", "roles", "actions"].includes(params.rbacView)
    ? params.rbacView : "users") as RbacView;
  const { setCrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setCrumbs([{ label: "RBAC" }, { label: TAB_LABELS[view] }]);
  }, [view, setCrumbs]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setParams({ rbacView: t.id })}
              className={`px-3 py-1.5 text-sm rounded transition ${
                view === t.id
                  ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
