"use client";

import { useEffect, useState, useCallback } from "react";
import { useUrlState } from "@/hooks/useUrlState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableMeta {
  name: string;
  label: string;
  description: string;
  group: string;
  count: number;
}

type Row = Record<string, unknown>;

interface TableData {
  rows: Row[];
  total: number;
  page: number;
  pages: number;
  columns: string[];
  sortableFields: string[];
}

// ─── Value renderers ──────────────────────────────────────────────────────────

function formatCell(val: unknown, truncate = true): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val instanceof Date || (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
    return new Date(val as string).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }
  if (typeof val === "object") return truncate ? "{…}" : JSON.stringify(val, null, 2);
  const str = String(val);
  return truncate && str.length > 48 ? str.slice(0, 48) + "…" : str;
}

function CellValue({ val }: { val: unknown }) {
  if (typeof val === "boolean") {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
        val ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
             : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}>
        {val ? "Yes" : "No"}
      </span>
    );
  }
  return <span className="text-gray-700 dark:text-slate-300">{formatCell(val)}</span>;
}

// ─── Pretty JSON viewer ───────────────────────────────────────────────────────

function JsonView({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (data === null || data === undefined) return <span className="text-gray-400">null</span>;
  if (typeof data !== "object") return <span className="text-gray-800 dark:text-slate-200">{String(data)}</span>;

  const json = JSON.stringify(data, null, 2);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
      >
        {open ? "▼ hide" : "▶ {…}"}
      </button>
      {open && (
        <pre className="mt-1.5 text-xs bg-gray-50 dark:bg-slate-900 rounded-lg p-3 overflow-x-auto text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-48">
          {json}
        </pre>
      )}
    </div>
  );
}

// ─── Row detail drawer ────────────────────────────────────────────────────────

function RowDrawer({ row, onClose }: { row: Row; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-lg h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Row Detail</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          {Object.entries(row).map(([key, val]) => (
            <div key={key} className="border-b border-gray-50 dark:border-slate-700/50 pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                {key}
              </p>
              {val !== null && typeof val === "object" && !(val instanceof Date) ? (
                <JsonView data={val} />
              ) : typeof val === "boolean" ? (
                <CellValue val={val} />
              ) : (
                <p className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {formatCell(val, false)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Table list sidebar ───────────────────────────────────────────────────────

function TableList({
  tables,
  selected,
  onSelect,
}: {
  tables: TableMeta[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  // Build ordered group map preserving insertion order from TABLE_CONFIGS
  const grouped: Record<string, TableMeta[]> = {};
  for (const t of tables) {
    if (!grouped[t.group]) grouped[t.group] = [];
    grouped[t.group].push(t);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
          Tables
        </p>
        <span className="text-xs text-gray-400 dark:text-slate-500">{tables.length}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(grouped).map(([group, groupTables]) => (
          <div key={group} className="mb-1">
            {/* Group header */}
            <div className="px-4 py-1.5">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                {group}
              </p>
            </div>
            {/* Tables in this group */}
            <div className="px-2 space-y-0.5">
              {groupTables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => onSelect(t.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selected === t.name
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                      : "hover:bg-gray-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${
                      selected === t.name ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-slate-200"
                    }`}>
                      {t.label}
                    </span>
                    <span className={`text-xs font-mono shrink-0 ${
                      selected === t.name ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
                    }`}>
                      {t.count.toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

// ─── Data table ───────────────────────────────────────────────────────────────

function DataTable({
  config,
  tableName,
  onBack,
}: {
  config: { search: string; sort: string; sortBy: string; page: string };
  tableName: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [urlState, setUrlState] = useUrlState({
    dsearch: "", dsort: "desc", dsortby: "", dpage: "1", drow: "",
  });

  const search  = urlState.dsearch;
  const sortOrder = urlState.dsort as "asc" | "desc";
  const sortBy  = urlState.dsortby;
  const page    = Math.max(1, parseInt(urlState.dpage) || 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sortOrder,
      ...(search  && { search }),
      ...(sortBy  && { sortBy }),
    });
    const res = await fetch(`/api/admin/database/${tableName}?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const d = await res.json();
    setData(d);
    setLoading(false);

    // Restore open row from URL after load
    if (urlState.drow && d.rows) {
      const r = d.rows.find((row: Row) => String(row.id) === urlState.drow);
      if (r) setSelectedRow(r);
    }
  }, [tableName, page, search, sortOrder, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when table changes
  useEffect(() => {
    setUrlState({ dpage: "1", dsearch: "", drow: "" });
    setSelectedRow(null);
  }, [tableName]);

  function openRow(row: Row) {
    setSelectedRow(row);
    setUrlState({ drow: String(row.id ?? "") });
  }

  function closeRow() {
    setSelectedRow(null);
    setUrlState({ drow: "" });
  }

  function toggleSort(col: string) {
    if (!data?.sortableFields.includes(col)) return;
    if (sortBy === col) {
      setUrlState({ dsort: sortOrder === "desc" ? "asc" : "desc", dpage: "1" });
    } else {
      setUrlState({ dsortby: col, dsort: "desc", dpage: "1" });
    }
  }

  const columns = data?.columns ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      {selectedRow && <RowDrawer row={selectedRow} onClose={closeRow} />}

      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0 flex-wrap gap-y-2">
        {/* Mobile back */}
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setUrlState({ dsearch: e.target.value, dpage: "1" })}
          className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
        />

        {data && data.total > 0 && (
          <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">
            {data.total.toLocaleString()} rows
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <svg className="w-8 h-8 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-gray-400">No rows found</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-900/95 backdrop-blur">
              <tr>
                {columns.map((col) => {
                  const sortable = data.sortableFields.includes(col);
                  const active = sortBy === col || (!sortBy && col === "createdAt");
                  return (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className={`text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b border-gray-200 dark:border-slate-700 whitespace-nowrap select-none ${
                        sortable ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" : ""
                      } ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-slate-400"}`}
                    >
                      <span className="flex items-center gap-1">
                        {col}
                        {sortable && active && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d={sortOrder === "desc" ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
                            />
                          </svg>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {data.rows.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  onClick={() => openRow(row)}
                  className="hover:bg-indigo-50/50 dark:hover:bg-slate-700/30 cursor-pointer transition"
                >
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 max-w-[200px] truncate text-gray-700 dark:text-slate-300 align-top">
                      <CellValue val={row[col]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700 text-sm">
          <span className="text-gray-500 dark:text-slate-400 text-xs">
            Page {page} of {data.pages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setUrlState({ dpage: "1" })}
              disabled={page === 1}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-600 dark:text-slate-300 text-xs"
            >
              «
            </button>
            <button
              onClick={() => setUrlState({ dpage: String(page - 1) })}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-600 dark:text-slate-300 text-xs"
            >
              Prev
            </button>
            <button
              onClick={() => setUrlState({ dpage: String(page + 1) })}
              disabled={page === data.pages}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-600 dark:text-slate-300 text-xs"
            >
              Next
            </button>
            <button
              onClick={() => setUrlState({ dpage: String(data.pages) })}
              disabled={page === data.pages}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition text-gray-600 dark:text-slate-300 text-xs"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function DatabaseSection() {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [urlState, setUrlState] = useUrlState({ dtable: "", dmobile: "list" });

  const selectedTable = urlState.dtable;
  // On mobile: "list" shows table list, "data" shows the table content
  const mobileView = urlState.dmobile as "list" | "data";

  useEffect(() => {
    fetch("/api/admin/database")
      .then((r) => r.json())
      .then((d) => {
        setTables(d.tables ?? []);
        // Auto-select first table if none selected
        if (!selectedTable && d.tables?.length > 0) {
          setUrlState({ dtable: d.tables[0].name });
        }
      })
      .finally(() => setLoadingMeta(false));
  }, []);

  function selectTable(name: string) {
    setUrlState({ dtable: name, dmobile: "data" });
  }

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeTableMeta = tables.find((t) => t.name === selectedTable);

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col">
      {/* Section header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Database</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Read-only view of all Prisma models · {tables.reduce((s, t) => s + t.count, 0).toLocaleString()} total records
        </p>
      </div>

      {/* Split layout */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex">

        {/* Sidebar — always visible on lg, toggleable on mobile */}
        <div className={`${
          mobileView === "list" ? "flex" : "hidden"
        } lg:flex flex-col w-full lg:w-64 xl:w-72 shrink-0 border-r border-gray-100 dark:border-slate-700`}>
          {loadingMeta ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TableList
              tables={tables}
              selected={selectedTable}
              onSelect={selectTable}
            />
          )}
        </div>

        {/* Data panel */}
        <div className={`${
          mobileView === "data" ? "flex" : "hidden"
        } lg:flex flex-col flex-1 min-w-0`}>
          {selectedTable ? (
            <>
              {/* Table name banner */}
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setUrlState({ dmobile: "list" })}
                  className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 4v16M14 4v16M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activeTableMeta?.label ?? selectedTable}
                  </span>
                  {activeTableMeta && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-slate-500 hidden sm:inline">
                      {activeTableMeta.count.toLocaleString()} rows
                    </span>
                  )}
                </div>
              </div>

              <DataTable
                key={selectedTable}
                tableName={selectedTable}
                config={{ search: "", sort: "desc", sortBy: "", page: "1" }}
                onBack={() => setUrlState({ dmobile: "list" })}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
              <svg className="w-12 h-12 text-gray-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p className="text-gray-400 dark:text-slate-500 text-sm">Select a table to browse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
