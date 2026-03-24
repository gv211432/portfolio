"use client";

import { useEffect, useState } from "react";
import Sparkline from "./shared/Sparkline";
import StatusBadge from "./shared/StatusBadge";

interface DashboardData {
  contacts: {
    total: number;
    new: number;
    thisWeek: number;
    trend: { date: string; count: number }[];
    recent: { id: string; name: string; email: string; budget: string; status: string; createdAt: string }[];
  };
  careers: {
    total: number;
    pending: number;
    thisWeek: number;
    trend: { date: string; count: number }[];
    recent: { id: string; legalName: string; email: string; jobTitle: string; status: string; createdAt: string }[];
  };
  chats: {
    totalThreads: number;
    totalMessages: number;
    thisWeek: number;
    totalLeads: number;
    trend: { date: string; count: number }[];
  };
}

function StatCard({
  title,
  value,
  sub,
  subLabel,
  trend,
  color,
  icon,
}: {
  title: string;
  value: number;
  sub: number;
  subLabel: string;
  trend: { date: string; count: number }[];
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      </div>
      <div className="mb-3">
        <Sparkline data={trend} color={color.includes("indigo") ? "#6366f1" : color.includes("emerald") ? "#10b981" : "#f59e0b"} height={36} />
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        <span className="font-semibold text-gray-700 dark:text-slate-300">+{sub}</span> {subLabel}
      </p>
    </div>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-red-500 text-sm p-4">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Last 30 days activity across all channels</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Contacts"
          value={data.contacts.total}
          sub={data.contacts.thisWeek}
          subLabel="this week"
          trend={data.contacts.trend}
          color="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Applications"
          value={data.careers.total}
          sub={data.careers.thisWeek}
          subLabel="this week"
          trend={data.careers.trend}
          color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="AI Chats"
          value={data.chats.totalThreads}
          sub={data.chats.thisWeek}
          subLabel="this week"
          trend={data.chats.trend}
          color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Contacts", value: data.contacts.new, color: "text-blue-600 dark:text-blue-400" },
          { label: "Pending Applications", value: data.careers.pending, color: "text-orange-600 dark:text-orange-400" },
          { label: "Chat Messages", value: data.chats.totalMessages, color: "text-purple-600 dark:text-purple-400" },
          { label: "Chat Leads", value: data.chats.totalLeads, color: "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Contacts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Contacts</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {data.contacts.recent.length === 0 && (
              <p className="text-sm text-gray-400 p-5">No contacts yet.</p>
            )}
            {data.contacts.recent.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email} · {c.budget}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} type="contact" />
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {data.careers.recent.length === 0 && (
              <p className="text-sm text-gray-400 p-5">No applications yet.</p>
            )}
            {data.careers.recent.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.legalName}</p>
                  <p className="text-xs text-gray-400 truncate">{a.jobTitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={a.status} type="career" />
                  <span className="text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
