"use client";

import { useEffect, useState } from "react";

export default function PolicySection() {
  const [domains, setDomains] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/policy/global").then(async (r) => {
      const d = await r.json();
      if (r.ok) {
        setDomains(Array.isArray(d.allowedDomains) ? d.allowedDomains.join(", ") : "");
        setUpdatedAt(d.updatedAt);
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    const list = domains.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/admin/policy/global", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedDomains: list }),
    });
    if (res.ok) {
      const d = await res.json();
      setDomains((d.allowedDomains as string[]).join(", "));
      setUpdatedAt(d.updatedAt);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Global outbound policy</h2>
        <p className="text-sm text-gray-500 mb-5">
          Domains listed below are the default allow-list for all staff.
          Any staff with a custom policy overrides this completely.
        </p>

        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Allowed recipient domains</label>
        <textarea
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          rows={4}
          placeholder="gaurav.one, google.com, anotherco.com"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white"
        />
        <p className="text-xs text-gray-500 mt-2">
          Comma or newline separated. Applies to <strong>To</strong>, <strong>Cc</strong>, <strong>Bcc</strong>.
          Any single violation rejects the entire email (it's routed to Outbox for admin review).
        </p>

        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-gray-400">
            {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : ""}
          </span>
          <button onClick={save}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
            {saved ? "Saved ✓" : "Save policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
