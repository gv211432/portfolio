"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { fmtMoney, STATUS_META } from "./types";

interface MonthBucket { month: string; raised: number; collected: number }
interface YearBucket  { year: number; raised: number; collected: number }
interface TopClient   { name: string; total: number }
interface Summary     { totalRaised: number; totalCollected: number; totalOutstanding: number; countRaised: number; countPaid: number }

interface AnalyticsData {
  year: number;
  currency: string;
  monthly: MonthBucket[];
  yearly: YearBucket[];
  statusCounts: Record<string, number>;
  topClients: TopClient[];
  summary: Summary;
  years: number[];
  currencies: string[];
}

const PIE_COLORS: Record<string, string> = {
  DRAFT:             "#64748b",
  FINALIZED:         "#2563eb",
  SENT:              "#4f46e5",
  PENDING_SIGNATURE: "#f59e0b",
  SIGNED:            "#16a34a",
  PARTLY_PAID:       "#f97316",
  PAID:              "#10b981",
  VOID:              "#ef4444",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function InvoiceTrends() {
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState("USD");
  const [view, setView]         = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoices/analytics?year=${year}&currency=${currency}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, currency]);

  const fmt = (n: number) => fmtMoney(n, currency);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pieData = Object.entries(data.statusCounts).map(([status, count]) => ({
    name: STATUS_META[status as keyof typeof STATUS_META]?.label ?? status,
    value: count,
    color: PIE_COLORS[status] ?? "#94a3b8",
  }));

  const chartData = view === "monthly" ? data.monthly : data.yearly.map(y => ({
    month: String(y.year), raised: y.raised, collected: y.collected,
  }));

  return (
    <div className="overflow-y-auto h-full p-4 space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          {(["monthly", "yearly"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded capitalize transition ${view === v ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {v}
            </button>
          ))}
        </div>

        {view === "monthly" && (
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        <select value={currency} onChange={(e) => setCurrency(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {(data.currencies.length > 0 ? data.currencies : [currency]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Invoiced" value={fmt(data.summary.totalRaised)} sub={`${data.summary.countRaised} invoices`} />
        <StatCard label="Collected" value={fmt(data.summary.totalCollected)} sub={`${data.summary.countPaid} paid`} />
        <StatCard label="Outstanding" value={fmt(data.summary.totalOutstanding)} />
        <StatCard label="Collection Rate"
          value={data.summary.totalRaised > 0 ? `${((data.summary.totalCollected / data.summary.totalRaised) * 100).toFixed(0)}%` : "—"} />
        <StatCard label="Avg Invoice"
          value={data.summary.countRaised > 0 ? fmt(data.summary.totalRaised / data.summary.countRaised) : "—"} />
      </div>

      {/* Revenue bar chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">
          {view === "monthly" ? `Revenue — ${year}` : "Revenue — All Years"}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${currency} ${(v / 1000).toFixed(0)}k`} width={60} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="raised"     name="Invoiced"   fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected"  name="Collected"  fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status breakdown pie */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Status Breakdown</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} invoices`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-gray-600 dark:text-slate-300">{entry.name}</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          )}
        </div>

        {/* Top clients */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Top Clients</p>
          {data.topClients.length > 0 ? (
            <div className="space-y-3">
              {data.topClients.map((c, i) => {
                const max = data.topClients[0].total;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-slate-300 truncate">{i + 1}. {c.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white ml-2 shrink-0">{fmt(c.total)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(c.total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          )}
        </div>
      </div>

      {/* Collection rate line chart (monthly only) */}
      {view === "monthly" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Collection Rate — {year}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly.map(m => ({
              month: m.month,
              rate: m.raised > 0 ? Math.round((m.collected / m.raised) * 100) : 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} width={40} />
              <Tooltip formatter={(v) => [`${v}%`, "Collection Rate"]} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
