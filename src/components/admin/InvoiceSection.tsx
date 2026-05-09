"use client";

import { useState } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import InvoiceList from "./invoice/InvoiceList";
import InvoiceEditor from "./invoice/InvoiceEditor";
import InvoiceDetail from "./invoice/InvoiceDetail";
import InvoiceSettings from "./invoice/InvoiceSettings";
import { InvoiceFull } from "./invoice/types";

type MainView = "list" | "new" | "edit" | "detail" | "settings";

const TABS = [
  { id: "list", label: "Invoices" },
  { id: "new", label: "+ New" },
  { id: "settings", label: "Settings" },
] as const;

export default function InvoiceSection() {
  const [params, setParams] = useUrlState({ invoiceView: "list", invoiceId: "" });

  const currentView = (["list", "new", "edit", "detail", "settings"].includes(params.invoiceView)
    ? params.invoiceView
    : "list") as MainView;
  const selectedId = params.invoiceId;

  function openInvoice(id: string) {
    setParams({ invoiceId: id, invoiceView: "detail" });
  }

  function openNew() {
    setParams({ invoiceId: "", invoiceView: "new" });
  }

  function openEdit(id: string) {
    setParams({ invoiceId: id, invoiceView: "edit" });
  }

  function backToList() {
    setParams({ invoiceView: "list", invoiceId: "" });
  }

  function handleSaved(invoice: InvoiceFull) {
    setParams({ invoiceId: invoice.id, invoiceView: "detail" });
  }

  const showTabs = currentView === "list" || currentView === "new" || currentView === "settings";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar — only for top-level views */}
      {showTabs && (
        <div className="flex gap-1 px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {TABS.map((t) => {
            const isActive =
              (t.id === "list" && currentView === "list") ||
              (t.id === "new" && currentView === "new") ||
              (t.id === "settings" && currentView === "settings");
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === "new") openNew();
                  else { setParams({ invoiceView: t.id, invoiceId: "" }); }
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === "list" && (
          <InvoiceList onOpen={openInvoice} onNew={openNew} />
        )}
        {currentView === "new" && (
          <InvoiceEditor
            key="new"
            onSaved={handleSaved}
            onClose={backToList}
          />
        )}
        {currentView === "edit" && selectedId && (
          <InvoiceEditor
            key={selectedId}
            invoiceId={selectedId}
            onSaved={handleSaved}
            onClose={() => { setParams({ invoiceView: "detail" }); }}
          />
        )}
        {currentView === "detail" && selectedId && (
          <InvoiceDetail
            invoiceId={selectedId}
            onEdit={() => openEdit(selectedId)}
            onClose={backToList}
            onDeleted={backToList}
          />
        )}
        {currentView === "settings" && (
          <InvoiceSettings />
        )}
      </div>
    </div>
  );
}
