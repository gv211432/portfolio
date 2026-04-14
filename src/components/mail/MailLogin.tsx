"use client";

/**
 * MailLogin — single component driving the entire login state machine.
 *
 *   email/password → (PASSWORD_RESET) → (2FA_SETUP) → (TOTP) → (EMAIL_OTP) → DONE → /mail
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step =
  | "LOGIN"
  | "PASSWORD_RESET"
  | "2FA_SETUP"
  | "TOTP"
  | "EMAIL_OTP"
  | "DONE";

export default function MailLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("LOGIN");
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  const syncMe = useCallback(async () => {
    const res = await fetch("/api/staff/auth/me");
    if (!res.ok) { setStep("LOGIN"); setLoading(false); return; }
    const data = await res.json();
    setMe(data);
    const stage = data.stage as string;
    const map: Record<string, Step> = {
      ACTIVE: "DONE",
      PENDING_PASSWORD_RESET: "PASSWORD_RESET",
      PENDING_2FA_SETUP: "2FA_SETUP",
      PENDING_TOTP: "TOTP",
      PENDING_EMAIL_OTP: "EMAIL_OTP",
    };
    setStep(map[stage] ?? "LOGIN");
    setLoading(false);
  }, []);

  useEffect(() => { void syncMe(); }, [syncMe]);

  useEffect(() => {
    if (step === "DONE") router.replace("/mail");
  }, [step, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mail</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sign in to your mailbox</p>
        </div>

        {step === "LOGIN" && <LoginForm onLogin={syncMe} />}
        {step === "PASSWORD_RESET" && <PasswordResetForm onDone={syncMe} />}
        {step === "2FA_SETUP" && <TwoFactorSetup me={me} onDone={syncMe} />}
        {step === "TOTP" && <ChallengeForm method="TOTP" onDone={syncMe} />}
        {step === "EMAIL_OTP" && <ChallengeForm method="EMAIL_OTP" onDone={syncMe} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/staff/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Login failed");
      return;
    }
    onLogin();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <LabeledInput label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
      <LabeledInput label="Password" type="password" value={password} onChange={setPassword} required />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
function PasswordResetForm({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 10) return setError("Password must be ≥ 10 characters");
    if (pw !== pw2) return setError("Passwords don't match");
    setBusy(true);
    const res = await fetch("/api/staff/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pw }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); return setError(d.error); }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
        First sign-in — please set a new password.
      </div>
      <LabeledInput label="New password" type="password" value={pw} onChange={setPw} required />
      <LabeledInput label="Confirm password" type="password" value={pw2} onChange={setPw2} required />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
function TwoFactorSetup({ me, onDone }: { me: any; onDone: () => void }) {
  const [picked, setPicked] = useState<"TOTP" | "EMAIL_OTP" | null>(null);
  const totpEnabled = !!me?.twoFactor?.find((f: any) => f.method === "TOTP" && f.enabled);
  const emailEnabled = !!me?.twoFactor?.find((f: any) => f.method === "EMAIL_OTP" && f.enabled);
  const anyEnabled = totpEnabled || emailEnabled;

  if (picked === "TOTP") return <TotpEnroll onBack={() => setPicked(null)} onDone={onDone} />;
  if (picked === "EMAIL_OTP") return <EmailOtpEnroll me={me} onBack={() => setPicked(null)} onDone={onDone} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-slate-300">
        Set up <strong>at least one</strong> factor. You can add both for extra security.
      </p>
      <div className="space-y-2">
        <MethodCard
          title="Authenticator app (TOTP)"
          desc="Google Authenticator, 1Password, etc. — scan a QR code."
          enabled={totpEnabled}
          onClick={() => setPicked("TOTP")}
        />
        <MethodCard
          title="Email one-time code"
          desc="We send a 6-digit code to your email."
          enabled={emailEnabled}
          onClick={() => setPicked("EMAIL_OTP")}
        />
      </div>
      {anyEnabled && (
        <button onClick={onDone}
          className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-slate-800 text-white text-sm font-medium">
          Continue to mailbox
        </button>
      )}
    </div>
  );
}

function MethodCard({ title, desc, enabled, onClick }: { title: string; desc: string; enabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</div>
      </div>
      {enabled
        ? <span className="text-green-600 dark:text-green-400 text-xs font-medium shrink-0">✓ Enabled</span>
        : <span className="text-gray-400 text-xs shrink-0">Set up →</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
function TotpEnroll({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/staff/auth/2fa/totp/setup", { method: "POST" })
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) { setQr(d.qrDataUrl); setSecret(d.secret); }
      });
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/staff/auth/2fa/totp/verify-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); return setErr(d.error ?? "Invalid"); }
    onDone();
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-500">← Back</button>
      <h3 className="font-medium text-gray-900 dark:text-white">Authenticator app</h3>
      {qr ? (
        <>
          <img src={qr} alt="QR code" className="mx-auto rounded-lg border border-gray-200 dark:border-slate-700" />
          {secret && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Or enter this secret manually</p>
              <code className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">{secret}</code>
            </div>
          )}
          <LabeledInput label="Enter 6-digit code from your app" value={code} onChange={setCode} required autoFocus />
          {err && <div className="text-sm text-red-500">{err}</div>}
          <button type="submit" disabled={busy}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
            {busy ? "Verifying…" : "Verify & enable"}
          </button>
        </>
      ) : (
        <div className="text-center text-sm text-gray-400 py-8">Preparing QR code…</div>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
function EmailOtpEnroll({ me, onBack, onDone }: { me: any; onBack: () => void; onDone: () => void }) {
  const [stage, setStage] = useState<"SENDING" | "CONFIRM">("SENDING");
  const [target, setTarget] = useState(me?.staff?.email ?? "");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/staff/auth/2fa/email/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetEmail: target }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); return setErr(d.error); }
    setStage("CONFIRM");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/staff/auth/2fa/email/verify-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); return setErr(d.error); }
    onDone();
  }

  if (stage === "SENDING") {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-gray-500">← Back</button>
        <h3 className="font-medium text-gray-900 dark:text-white">Email one-time code</h3>
        <LabeledInput label="Send codes to" type="email" value={target} onChange={setTarget} required />
        <p className="text-xs text-gray-500">
          Defaults to your new mailbox address; you can change it if SES isn't receiving yet.
        </p>
        {err && <div className="text-sm text-red-500">{err}</div>}
        <button onClick={sendCode} disabled={busy}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
          {busy ? "Sending…" : "Send verification code"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <button type="button" onClick={() => setStage("SENDING")} className="text-sm text-gray-500">← Change email</button>
      <h3 className="font-medium text-gray-900 dark:text-white">Enter code</h3>
      <p className="text-sm text-gray-500">Sent to <strong>{target}</strong>. Expires in 10 min.</p>
      <LabeledInput label="6-digit code" value={code} onChange={setCode} required autoFocus />
      {err && <div className="text-sm text-red-500">{err}</div>}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Verifying…" : "Verify & enable"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
function ChallengeForm({ method, onDone }: { method: "TOTP" | "EMAIL_OTP"; onDone: () => void }) {
  const [hint, setHint] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (method !== "EMAIL_OTP") return;
    fetch("/api/staff/auth/2fa/challenge")
      .then(async (r) => { const d = await r.json(); if (r.ok) setHint(d.targetHint ?? null); });
  }, [method]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/staff/auth/2fa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json(); return setErr(d.error); }
    onDone();
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">
        {method === "TOTP" ? "Two-factor code" : "Check your email"}
      </h3>
      <p className="text-sm text-gray-500">
        {method === "TOTP"
          ? "Enter the 6-digit code from your authenticator app."
          : <>We sent a code to <strong>{hint ?? "your email"}</strong>.</>}
      </p>
      <LabeledInput label="Code" value={code} onChange={setCode} required autoFocus />
      {err && <div className="text-sm text-red-500">{err}</div>}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Verifying…" : "Continue"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
function LabeledInput({ label, type = "text", value, onChange, required, autoFocus }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  required?: boolean; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type} value={value} required={required} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />
    </div>
  );
}
