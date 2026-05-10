"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminProfile {
  id: string;
  username: string;
  displayName: string | null;
  recoveryEmail: string | null;
  recoveryEmailVerified: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  roles: { role: { name: string; color: string | null } }[];
}

interface Props {
  onClose: () => void;
}

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

// ── Sub-section: Change Password ──────────────────────────────────────────────
function ChangePassword({ adminId }: { adminId: string }) {
  const [otpSent, setOtpSent]     = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [totpCode, setTotpCode]   = useState("");
  const [emailOtp, setEmailOtp]   = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  async function sendOtp() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "change_password" }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setMaskedEmail(d.maskedEmail);
      setOtpSent(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function submit() {
    if (newPw !== confirmPw) { setError("Passwords don't match"); return; }
    if (newPw.length < 8)   { setError("Minimum 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode, emailOtp, newPassword: newPw }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) { setError(d.error ?? "Failed"); return; }
      setDone(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="text-center py-4 text-emerald-500">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <p className="text-sm font-medium text-gray-900 dark:text-white">Password changed.</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Your next login will use the new password.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      {!otpSent ? (
        <>
          <p className="text-xs text-gray-500 dark:text-slate-400">We'll send a verification code to your recovery email, then you must also enter your authenticator code.</p>
          <button onClick={sendOtp} disabled={loading} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {loading ? "Sending…" : "Send Email Code"}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-slate-400">Code sent to <strong>{maskedEmail}</strong></p>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Authenticator Code</label>
            <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email Code</label>
            <input type="text" inputMode="numeric" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Confirm Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat" className={inputCls} />
          </div>
          <button onClick={submit} disabled={loading || totpCode.length < 6 || emailOtp.length < 6 || newPw.length < 8}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {loading ? "Saving…" : "Change Password"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Sub-section: Change Recovery Email ───────────────────────────────────────
function ChangeEmail() {
  const [step, setStep]           = useState<"form" | "otp">("form");
  const [totpCode, setTotpCode]   = useState("");
  const [password, setPassword]   = useState("");
  const [newEmail, setNewEmail]   = useState("");
  const [otp, setOtp]             = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  async function initiate() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/change-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode, password, newEmail }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setMaskedEmail(d.maskedEmail);
      setStep("otp");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function verify() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/verify-change-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) { setError(d.error ?? "Failed"); return; }
      setDone(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="text-center py-4 text-emerald-500">
      <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <p className="text-sm font-medium text-gray-900 dark:text-white">Recovery email updated.</p>
    </div>
  );

  if (step === "otp") return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <p className="text-xs text-gray-500 dark:text-slate-400">Code sent to <strong>{maskedEmail}</strong></p>
      <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
      <button onClick={verify} disabled={loading || otp.length < 6} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
        {loading ? "Verifying…" : "Confirm New Email"}
      </button>
      <button onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="w-full text-xs text-gray-500 dark:text-slate-400 hover:underline">← Change email</button>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Authenticator Code</label>
        <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Current Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">New Recovery Email</label>
        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="personal@email.com" className={inputCls} />
      </div>
      <button onClick={initiate} disabled={loading || totpCode.length < 6 || !password || !newEmail.includes("@")}
        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
        {loading ? "Sending…" : "Send Verification Code"}
      </button>
    </div>
  );
}

// ── Sub-section: Reset TOTP ───────────────────────────────────────────────────
function ResetTotp() {
  const [mode, setMode]           = useState<"pw_email" | "recovery">("pw_email");
  const [password, setPassword]   = useState("");
  const [emailOtp, setEmailOtp]   = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function sendOtp() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "change_password" }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setMaskedEmail(d.maskedEmail); setOtpSent(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function verify() {
    setError(""); setLoading(true);
    try {
      const body: Record<string, string> = mode === "pw_email"
        ? { password, emailOtp }
        : { recoveryCode, ...(emailOtp ? { emailOtp } : { password }) };
      const res = await fetch("/api/admin/profile/reset-totp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setSetupToken(d.setupToken);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  if (setupToken) return (
    <div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Identity verified. Scan the new QR code with your authenticator app.</p>
      <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
        This will open the TOTP setup flow. After completing it, you'll need to log out and back in.
        <br /><br />
        <a href={`/api/admin/totp/setup`} className="underline">Setup token available</a> — use your <strong>setupToken</strong> from the profile reset endpoint in the setup flow.
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">setupToken (copy for TOTP setup): <code className="font-mono break-all">{setupToken.slice(0, 20)}…</code></p>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setMode("pw_email")} className={`flex-1 py-1.5 text-xs rounded-lg border transition ${mode === "pw_email" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300"}`}>
          Password + Email
        </button>
        <button onClick={() => setMode("recovery")} className={`flex-1 py-1.5 text-xs rounded-lg border transition ${mode === "recovery" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300"}`}>
          Recovery Code
        </button>
      </div>

      {mode === "pw_email" && (
        <>
          {!otpSent ? (
            <button onClick={sendOtp} disabled={loading} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
              {loading ? "Sending…" : "Send Email Code First"}
            </button>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-slate-400">Code sent to <strong>{maskedEmail}</strong></p>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email Code</label>
                <input type="text" inputMode="numeric" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Current Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
              </div>
              <button onClick={verify} disabled={loading || emailOtp.length < 6 || !password}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
                {loading ? "Verifying…" : "Reset TOTP"}
              </button>
            </>
          )}
        </>
      )}

      {mode === "recovery" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Recovery Code (XXXX-XXXX-XX)</label>
            <input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="ABCD-EFGH-IJ" className={inputCls + " font-mono"} />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">Plus one of:</p>
          {!otpSent ? (
            <button onClick={sendOtp} disabled={loading} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
              {loading ? "Sending…" : "Send Email Code"}
            </button>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-slate-400">Code sent to <strong>{maskedEmail}</strong></p>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email Code</label>
                <input type="text" inputMode="numeric" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Or current password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
          <button onClick={verify} disabled={loading || !recoveryCode || (!emailOtp && !password)}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
            {loading ? "Verifying…" : "Reset TOTP"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Sub-section: Regenerate Recovery Codes ────────────────────────────────────
function RecoveryCodes() {
  const [totpCode, setTotpCode] = useState("");
  const [codes, setCodes]       = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function regenerate() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/recovery-codes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Failed"); return; }
      setCodes(d.recoveryCodes);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  function download() {
    const text = ["Gaurav.One Admin — Recovery Codes", "Generated: " + new Date().toLocaleString(), "Each code can only be used once.", "", ...codes].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = "recovery-codes.txt"; a.click();
  }

  if (codes.length > 0) return (
    <div>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 font-medium">⚠ Save these now. They won't be shown again.</p>
      <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 grid grid-cols-2 gap-1.5 mb-3">
        {codes.map((c) => <code key={c} className="text-indigo-600 dark:text-indigo-400 font-mono text-xs text-center py-1 bg-white dark:bg-slate-800 rounded">{c}</code>)}
      </div>
      <button onClick={download} className="w-full px-4 py-2 border border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
        Download Codes
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <p className="text-xs text-gray-500 dark:text-slate-400">This will invalidate all existing recovery codes. Verify with your authenticator to proceed.</p>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Authenticator Code</label>
        <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={inputCls + " text-center tracking-widest font-mono"} />
      </div>
      <button onClick={regenerate} disabled={loading || totpCode.length < 6}
        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50">
        {loading ? "Regenerating…" : "Regenerate Recovery Codes"}
      </button>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

export default function AdminProfileDrawer({ onClose }: Props) {
  const [profile, setProfile]   = useState<AdminProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/profile");
    if (res.ok) { const { admin } = await res.json(); setProfile(admin); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = [
    { key: "change_password", label: "Change Password",       icon: "🔑", component: profile ? <ChangePassword adminId={profile.id} /> : null },
    { key: "change_email",    label: "Change Recovery Email", icon: "📧", component: <ChangeEmail /> },
    { key: "reset_totp",      label: "Reset Authenticator",   icon: "📱", component: <ResetTotp /> },
    { key: "recovery_codes",  label: "Recovery Codes",        icon: "🛡", component: <RecoveryCodes /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile & Security</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Profile card */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {(profile.displayName ?? profile.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{profile.displayName ?? profile.username}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">@{profile.username}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {profile.roles.map((r) => (
                      <span key={r.role.name} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: r.role.color ?? "#6366f1" }}>
                        {r.role.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Security Status</p>
                {[
                  { label: "Authenticator (TOTP)", ok: profile.totpEnabled },
                  { label: "Recovery Email", ok: profile.recoveryEmailVerified, sub: profile.recoveryEmail ?? undefined },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700 dark:text-slate-300">{item.label}</span>
                      {item.sub && <p className="text-xs text-gray-400 dark:text-slate-500">{item.sub}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {item.ok ? "Enabled" : "Not set"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Security actions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Security Actions</p>
                <div className="space-y-2">
                  {sections.map((s) => (
                    <div key={s.key} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                      <button
                        onClick={() => setOpenSection((prev) => prev === s.key ? null : s.key)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{s.icon}</span> {s.label}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${openSection === s.key ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openSection === s.key && (
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
                          {s.component}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 dark:text-slate-500 text-sm py-10">Failed to load profile</p>
          )}
        </div>
      </div>
    </>
  );
}
