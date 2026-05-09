"use client";

import { useState, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import ContactsSection from "./ContactsSection";
import CareersSection from "./CareersSection";
import ChatsSection from "./ChatsSection";
import DatabaseSection from "./DatabaseSection";
import NgoSection from "./NgoSection";
import NotificationsSection from "./NotificationsSection";
import StaffSection from "./StaffSection";
import PolicySection from "./PolicySection";
import ActivitySection from "./ActivitySection";
import MailboxSection from "./MailboxSection";
import InvoiceSection from "./InvoiceSection";

type Section = "dashboard" | "contacts" | "careers" | "chats" | "database" | "ngo" | "notifications" | "staff" | "mailbox" | "policy" | "activity" | "invoice";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "careers",
    label: "Careers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "chats",
    label: "Chats",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "ngo",
    label: "NGO",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "staff",
    label: "Staff",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: "mailbox",
    label: "Mailbox",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9 5-9-5m18 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8m18 0L12 3 3 8" />
      </svg>
    ),
  },
  {
    id: "policy",
    label: "Mail Policy",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "database",
    label: "Database",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
];

function Sidebar({
  active,
  setActive,
  username,
  onLogout,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  active: Section;
  setActive: (s: Section) => void;
  username: string;
  onLogout: () => void;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
      {/* Header — logo + collapse toggle */}
      <div className={`flex items-center border-b border-slate-800 transition-all duration-300 ${collapsed ? "px-0 py-4 justify-center" : "px-4 py-4 justify-between"}`}>
        {collapsed ? (
          /* Collapsed: just the logo, centered */
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="flex items-center justify-center w-10 h-10 rounded-xl 
            bg-slate-100 hover:bg-slate-200 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo/gaurav-dot-one-transparent-gray.webp"
              alt="Gaurav.One"
              className="w-7 h-7 object-contain opacity-80"
            />
          </button>
        ) : (
          <>
            {/* Expanded: logo + wordmark */}
            <div className="flex items-center gap-2.5 min-w-0 ">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logo/gaurav-dot-one-transparent-gray.webp"
                alt="Gaurav.One"
                className="w-7 h-7 object-contain opacity-90 shrink-0 bg-slate-100 rounded-md"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight leading-tight truncate">Gaurav.One</p>
                <p className="text-[10px] text-slate-400 leading-tight">Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Desktop collapse button */}
              <button
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Mobile close button */}
              {onClose && (
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition lg:hidden">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3"}`}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); onClose?.(); }}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200
              ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}
              ${active === item.id
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className={`border-t border-slate-800 ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
        {collapsed ? (
          /* Collapsed: just avatar + sign-out stacked */
          <div className="flex flex-col items-center gap-2">
            <div
              title={username}
              className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0"
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          /* Expanded: full user row */
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{username}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        {/* Expand button when collapsed (desktop) */}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="hidden lg:flex w-full items-center justify-center mt-2 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminShell() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [username, setUsername] = useState("");
  const [active, setActiveState] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapse state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("admin_sidebar_collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  // Hydrate active tab from URL on mount
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tab = sp.get("tab") as Section | null;
    if (tab && ["dashboard", "contacts", "careers", "chats", "database", "ngo", "notifications", "staff", "mailbox", "policy", "activity", "invoice"].includes(tab)) {
      setActiveState(tab);
    }
  }, []);

  function setActive(tab: Section) {
    // Replace the entire URL — clears all section-specific filter/detail params on tab switch
    const qs = tab === "dashboard" ? "" : `?tab=${tab}`;
    window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
    setActiveState(tab);
  }

  // Check existing session
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => {
        if (r.ok) return r.json();
        return { authenticated: false };
      })
      .then((d) => {
        setAuthed(d.authenticated);
        if (d.authenticated) setUsername(d.username);
      })
      .catch(() => setAuthed(false));
  }, []);

  async function handleLogout() {
    if (!confirm("Sign out of the admin dashboard?")) return;
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setUsername("");
  }

  // Loading state
  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={(u) => { setAuthed(true); setUsername(u); }} />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-auto lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        <Sidebar
          active={active}
          setActive={setActive}
          username={username}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {NAV.find((n) => n.id === active)?.icon && (
              <span className="text-gray-400 dark:text-slate-500">
                {NAV.find((n) => n.id === active)?.icon}
              </span>
            )}
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              {NAV.find((n) => n.id === active)?.label}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400 dark:text-slate-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
          </div>
        </header>

        {/* Content — invoice manages its own layout/scroll; others get default padding */}
        {active === "invoice" ? (
          <main className="flex-1 overflow-hidden min-h-0">
            <InvoiceSection />
          </main>
        ) : (
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
            {active === "dashboard" && <Dashboard />}
            {active === "contacts" && <ContactsSection />}
            {active === "careers" && <CareersSection />}
            {active === "chats" && <ChatsSection />}
            {active === "ngo" && <NgoSection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "staff" && <StaffSection />}
            {active === "mailbox" && <MailboxSection />}
            {active === "policy" && <PolicySection />}
            {active === "activity" && <ActivitySection />}
            {active === "database" && <DatabaseSection />}
          </main>
        )}
      </div>
    </div>
  );
}
