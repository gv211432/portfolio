"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import TotpSetup from "./TotpSetup";

interface Props {
  onLogin: (username: string) => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [totp, setTotp]           = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const totpRef = useRef<HTMLInputElement>(null);

  // After returning from 2FA setup, nudge user to enter their TOTP
  const [justSetup, setJustSetup] = useState(false);

  useEffect(() => {
    if (justSetup) totpRef.current?.focus();
  }, [justSetup]);

  function handleSetupComplete() {
    setSetupToken(null);
    setJustSetup(true);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, totp: totp.trim() || undefined }),
      });
      const data = await res.json();

      if (data.requiresTotpSetup) {
        // Password correct but 2FA not set — go to setup flow
        setSetupToken(data.setupToken);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.message ?? "Invalid credentials");
        setTotp("");
        return;
      }

      onLogin(data.username);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── 2FA setup flow ────────────────────────────────────────────────────────
  if (setupToken) {
    return <TotpSetup setupToken={setupToken} onComplete={handleSetupComplete} />;
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-slate-400 text-sm mt-1">Gaurav.One Dashboard</p>
        </div>

        {justSetup && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            2FA enabled! Sign in with your authenticator code below.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Authenticator Code
              <span className="ml-1 text-slate-600 normal-case font-normal">(required after setup)</span>
            </label>
            <input
              ref={totpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:tracking-normal placeholder:font-sans"
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-4">
          Session expires after 8 hours
        </p>
      </div>
    </div>
  );
}
