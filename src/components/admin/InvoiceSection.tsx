"use client";

import { useState, useEffect } from "react";
import { useUrlState } from "@/hooks/useUrlState";
import InvoiceList from "./invoice/InvoiceList";
import InvoiceEditor from "./invoice/InvoiceEditor";
import InvoiceDetail from "./invoice/InvoiceDetail";
import InvoiceSettings from "./invoice/InvoiceSettings";
import { InvoiceFull } from "./invoice/types";
import { useBreadcrumbStore } from "@/Atoms/globalAtoms";

type MainView = "list" | "new" | "edit" | "detail" | "settings";

const TABS = [
  { id: "list", label: "Invoices" },
  { id: "new", label: "+ New" },
  { id: "settings", label: "Settings" },
] as const;

export default function InvoiceSection() {
  const [params, setParams] = useUrlState({ invoiceView: "list", invoiceId: "" });
  const [invoiceLabel, setInvoiceLabel] = useState("");
  const { setCrumbs } = useBreadcrumbStore();

  const currentView = (["list", "new", "edit", "detail", "settings"].includes(params.invoiceView)
    ? params.invoiceView
    : "list") as MainView;
  const selectedId = params.invoiceId;

  function openInvoice(id: string) {
    setParams({ invoiceId: id, invoiceView: "detail" });
  }

  function openNew() {
    setInvoiceLabel("");
    setParams({ invoiceId: "", invoiceView: "new" });
  }

  function openEdit(id: string) {
    setParams({ invoiceId: id, invoiceView: "edit" });
  }

  function backToList() {
    setInvoiceLabel("");
    setParams({ invoiceView: "list", invoiceId: "" });
  }

  function backToDetail() {
    setParams({ invoiceView: "detail" });
  }

  function handleSaved(invoice: InvoiceFull) {
    setParams({ invoiceId: invoice.id, invoiceView: "detail" });
  }

  // Sync breadcrumbs whenever view or invoice label changes
  useEffect(() => {
    if (currentView === "list") {
      setCrumbs([{ label: "Invoice" }]);
    } else if (currentView === "new") {
      setCrumbs([
        { label: "Invoice", onClick: backToList },
        { label: "New Invoice" },
      ]);
    } else if (currentView === "settings") {
      setCrumbs([
        { label: "Invoice", onClick: backToList },
        { label: "Settings" },
      ]);
    } else if (currentView === "detail") {
      setCrumbs([
        { label: "Invoice", onClick: backToList },
        { label: invoiceLabel || "…" },
      ]);
    } else if (currentView === "edit") {
      setCrumbs([
        { label: "Invoice", onClick: backToList },
        { label: invoiceLabel || "…", onClick: backToDetail },
        { label: "Edit" },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, invoiceLabel]);

  const showTabs = currentView === "list" || currentView === "new" || currentView === "settings";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar — only for top-level views */}
      {showTabs && (
        <div className="flex items-center px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
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
                  className={`px-3 py-1.5 text-sm rounded transition ${
                    isActive
                      ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
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
            onLoaded={(num) => setInvoiceLabel(num)}
          />
        )}
        {currentView === "edit" && selectedId && (
          <InvoiceEditor
            key={selectedId}
            invoiceId={selectedId}
            onSaved={handleSaved}
            onClose={backToDetail}
            onLoaded={(num) => setInvoiceLabel(num)}
          />
        )}
        {currentView === "detail" && selectedId && (
          <InvoiceDetail
            invoiceId={selectedId}
            onEdit={() => openEdit(selectedId)}
            onClose={backToList}
            onDeleted={backToList}
            onLoaded={(inv) => setInvoiceLabel(inv.invoiceNumber)}
          />
        )}
        {currentView === "settings" && (
          <InvoiceSettings />
        )}
      </div>
    </div>
  );
}
