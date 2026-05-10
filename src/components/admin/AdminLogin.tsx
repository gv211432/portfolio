"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import TotpSetup from "./TotpSetup";

interface Props {
  onLogin: (username: string) => void;
}

// ── Forgot Password flow ───────────────────────────────────────────────────────

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"username" | "verify" | "reset" | "done">("username");
  const [username, setUsername]       = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [totpOrRecovery, setTotpOrRecovery] = useState("");
  const [emailOtp, setEmailOtp]       = useState("");
  const [resetToken, setResetToken]   = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setMaskedEmail(data.maskedEmail);
      setStep("verify");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), totpOrRecovery, emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      setResetToken(data.resetToken);
      setStep("reset");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPw) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8)   { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Failed"); return; }
      setStep("done");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Verify your identity to continue</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {step === "username" && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="admin" required autoComplete="username" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition">
                {loading ? "Sending code…" : "Send Recovery Code →"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={verify} className="space-y-4">
              <p className="text-slate-400 text-xs">
                A 6-digit code was sent to <strong className="text-slate-200">{maskedEmail}</strong>. Enter it below along with your authenticator code (or a recovery code).
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Authenticator or Recovery Code</label>
                <input value={totpOrRecovery} onChange={(e) => setTotpOrRecovery(e.target.value)} className={inputCls} placeholder="6-digit TOTP or XXXX-XXXX-XX" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email Verification Code</label>
                <input type="text" inputMode="numeric" maxLength={6} value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  className={inputCls + " text-center tracking-[0.4em] font-mono"}
                  placeholder="000000" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition">
                {loading ? "Verifying…" : "Verify Identity →"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className={inputCls + " pr-10"} placeholder="Min 8 characters" required />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} placeholder="Repeat password" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition">
                {loading ? "Saving…" : "Set New Password →"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-2">
              <div className="text-green-400 mb-3">
                <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">Password updated</p>
              <p className="text-slate-400 text-xs mb-4">Sign in with your new password.</p>
              <button onClick={onBack} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition">
                ← Back to Login
              </button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <button onClick={onBack} className="block w-full text-center text-slate-600 hover:text-slate-400 text-xs mt-4 transition">
            ← Back to login
          </button>
        )}
      </div>
    </div>
  );
}

// ── Setup email (for existing users whose recovery email isn't verified) ───────

function SetupEmailFlow({
  emailSetupToken,
  onComplete,
}: {
  emailSetupToken: string;
  onComplete: (username: string) => void;
}) {
  const [step, setStep]           = useState<"email" | "otp">("email");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const inputCls = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition";

  async function sendCode() {
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth/setup-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSetupToken, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setMaskedEmail(data.maskedEmail);
      setStep("otp");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function verify() {
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth/verify-setup-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSetupToken, email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Failed"); return; }
      onComplete(data.username);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Recovery Email</h1>
          <p className="text-slate-400 text-sm mt-1">Required before accessing the dashboard</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {step === "email" && (
            <>
              <p className="text-slate-400 text-xs">Your recovery email is used to reset your password and verify identity changes. It must be a personal email you control.</p>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Recovery Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="your@personal-email.com" autoComplete="email" />
              </div>
              <button onClick={sendCode} disabled={loading || !email.includes("@")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition">
                {loading ? "Sending…" : "Send Verification Code →"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-slate-400 text-xs">
                Code sent to <strong className="text-slate-200">{maskedEmail}</strong>. Expires in 10 minutes.
              </p>
              <input type="text" inputMode="numeric" maxLength={6} value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                className={inputCls + " text-center tracking-[0.4em] font-mono text-2xl py-3"}
                placeholder="000000" />
              <button onClick={verify} disabled={loading || otp.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition">
                {loading ? "Verifying…" : "Verify & Enter Dashboard →"}
              </button>
              <button onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="w-full text-slate-500 hover:text-slate-300 text-xs transition">
                ← Change email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Login form ────────────────────────────────────────────────────────────

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [totp, setTotp]           = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [emailSetupToken, setEmailSetupToken] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [justSetup, setJustSetup] = useState(false);
  const totpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (justSetup) totpRef.current?.focus();
  }, [justSetup]);

  function handleTotpSetupComplete(sessionUsername?: string) {
    if (sessionUsername) {
      // Session was issued directly (email verified in TotpSetup)
      onLogin(sessionUsername);
    } else {
      setSetupToken(null);
      setJustSetup(true);
      setError("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, totp: totp.trim() || undefined }),
      });
      const data = await res.json();

      if (data.requiresTotpSetup) {
        setSetupToken(data.setupToken);
        return;
      }

      if (data.requiresEmailSetup) {
        setEmailSetupToken(data.emailSetupToken);
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

  // Flows
  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;
  if (setupToken)  return <TotpSetup setupToken={setupToken} onComplete={handleTotpSetupComplete} />;
  if (emailSetupToken) return <SetupEmailFlow emailSetupToken={emailSetupToken} onComplete={onLogin} />;

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
            Account fully set up! Sign in below.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="admin" required autoComplete="username" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="••••••••" required autoComplete="current-password" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Authenticator Code
              <span className="ml-1 text-slate-600 normal-case font-normal">(leave blank on first login)</span>
            </label>
            <input ref={totpRef} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={totp} onChange={(e) => setTotp(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:tracking-normal placeholder:font-sans"
              placeholder="6-digit code" autoComplete="one-time-code" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition mt-2">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-slate-600 text-xs">Session expires after 8 hours</p>
          <button onClick={() => setShowForgot(true)} className="text-slate-500 hover:text-indigo-400 text-xs transition">
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
