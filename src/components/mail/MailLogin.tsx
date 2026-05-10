"use client";

/**
 * MailLogin — single component driving the entire login state machine.
 *
 *   email/password → (PASSWORD_RESET) → (2FA_SETUP) → (TOTP) → (EMAIL_OTP) → DONE → /mail
 *   → "Forgot password?" → ForgotPasswordFlow (OTP to recovery email → new password)
 *   → "Contact support"  → ContactSupportForm
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step =
  | "LOGIN"
  | "PASSWORD_RESET"
  | "2FA_SETUP"
  | "TOTP"
  | "EMAIL_OTP"
  | "FORGOT_PASSWORD"
  | "CONTACT_SUPPORT"
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
  useEffect(() => { if (step === "DONE") router.replace("/mail"); }, [step, router]);

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
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/img/logo/gaurav-dot-one-transparent-gray.webp"
              alt="Gaurav.one"
              className="block dark:hidden h-10 w-auto object-contain rounded-lg"
            />
            <img
              src="/img/logo/gaurav-dot-one-white.webp"
              alt="Gaurav.one"
              className="hidden dark:block h-10 w-auto object-contain rounded-lg"
            />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mail</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {step === "FORGOT_PASSWORD" ? "Reset your password" :
             step === "CONTACT_SUPPORT" ? "Contact support" :
             "Sign in to your mailbox"}
          </p>
        </div>

        {step === "LOGIN" && (
          <LoginForm
            onLogin={syncMe}
            onForgotPassword={() => setStep("FORGOT_PASSWORD")}
            onContactSupport={() => setStep("CONTACT_SUPPORT")}
          />
        )}
        {step === "PASSWORD_RESET" && <PasswordResetForm onDone={syncMe} />}
        {step === "2FA_SETUP" && (
          <TwoFactorSetup
            me={me}
            onDone={syncMe}
            onLogout={async () => {
              await fetch("/api/staff/auth/logout", { method: "POST" });
              setStep("LOGIN");
              setMe(null);
            }}
          />
        )}
        {step === "TOTP" && <ChallengeForm method="TOTP" onDone={syncMe} />}
        {step === "EMAIL_OTP" && <ChallengeForm method="EMAIL_OTP" onDone={syncMe} />}
        {step === "FORGOT_PASSWORD" && (
          <ForgotPasswordFlow
            onBack={() => setStep("LOGIN")}
            onContactSupport={() => setStep("CONTACT_SUPPORT")}
            onDone={() => setStep("LOGIN")}
          />
        )}
        {step === "CONTACT_SUPPORT" && (
          <ContactSupportForm onBack={() => setStep("LOGIN")} />
        )}
      </div>
    </div>
  );
}

// ─── Login form ────────────────────────────────────────────────────────────────
function LoginForm({
  onLogin, onForgotPassword, onContactSupport,
}: {
  onLogin: () => void;
  onForgotPassword: () => void;
  onContactSupport: () => void;
}) {
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
      {error && <ErrorMsg text={error} />}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {/* Helper links */}
      <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-slate-400">
        <button
          type="button"
          onClick={onForgotPassword}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition underline-offset-2 hover:underline"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onContactSupport}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition underline-offset-2 hover:underline"
        >
          Contact support
        </button>
      </div>
    </form>
  );
}

// ─── Forgot password flow ──────────────────────────────────────────────────────
// Requires BOTH TOTP + EMAIL_OTP to be enrolled for self-service reset.
// If only one method enrolled → show clear "contact support" message.
type FpStep = "email" | "verify" | "success";

function ForgotPasswordFlow({
  onBack, onContactSupport, onDone,
}: {
  onBack: () => void;
  onContactSupport: () => void;
  onDone: () => void;
}) {
  const [fpStep, setFpStep]         = useState<FpStep>("email");
  const [email, setEmail]           = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [totpCode, setTotpCode]     = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  // enrolledMethods returned by the API when canReset: false
  const [enrolledMethods, setEnrolledMethods] = useState<string[]>([]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setEnrolledMethods([]);
    const res  = await fetch("/api/staff/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) { setError(data.error ?? "Request failed"); return; }

    if (!data.canReset) {
      setEnrolledMethods(data.enrolledMethods ?? []);
      setError("__cannot_reset__");
      return;
    }

    setMaskedEmail(data.maskedEmail ?? "your 2FA email");
    setFpStep("verify");
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPw.length < 10) { setError("Password must be at least 10 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match"); return; }

    setBusy(true);
    const res  = await fetch("/api/staff/auth/forgot-password/verify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim(), emailOtpCode, totpCode, newPassword: newPw }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
    setFpStep("success");
  }

  // ── step: enter email ──────────────────────────────────────────
  if (fpStep === "email") {
    const cannotReset = error === "__cannot_reset__";
    const hasTotp     = enrolledMethods.includes("TOTP");
    const hasEmail    = enrolledMethods.includes("EMAIL_OTP");
    const hasNeither  = enrolledMethods.length === 0;

    return (
      <form onSubmit={requestCode} className="space-y-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1">
          ← Back to sign in
        </button>

        {/* Instructions — always visible */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">How password reset works</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            You need <strong>both</strong> your authenticator app (TOTP) <em>and</em> your 2FA email to reset your password.
            If you only have one method set up, you cannot self-reset — please contact your admin.
          </p>
        </div>

        <LabeledInput label="Work email address" type="email" value={email} onChange={setEmail} required autoFocus />

        {/* Cannot-reset banner (shown after server responds) */}
        {cannotReset && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Self-reset not available
            </p>
            {hasNeither ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No 2FA methods are enrolled on this account, or the account doesn't exist.
              </p>
            ) : (
              <>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  You only have{" "}
                  <strong>{hasTotp ? "an authenticator app (TOTP)" : "email OTP"}</strong>{" "}
                  enrolled. Both TOTP <em>and</em> email 2FA are required for self-service reset.
                  Enrol both methods when you next log in, or contact support now.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${hasTotp ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-slate-800 text-gray-400"}`}>
                    {hasTotp ? "✓ Authenticator (TOTP)" : "✗ Authenticator (TOTP)"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${hasEmail ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-slate-800 text-gray-400"}`}>
                    {hasEmail ? "✓ Email OTP" : "✗ Email OTP"}
                  </span>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={onContactSupport}
              className="w-full py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
            >
              Contact support for manual reset →
            </button>
          </div>
        )}

        {error && error !== "__cannot_reset__" && <ErrorMsg text={error} />}

        <button type="submit" disabled={busy}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
          {busy ? "Checking account…" : "Send reset code"}
        </button>
      </form>
    );
  }

  // ── step: enter both codes + new password ──────────────────────
  if (fpStep === "verify") {
    return (
      <form onSubmit={verifyAndReset} className="space-y-4">
        <button type="button" onClick={() => { setFpStep("email"); setError(null); }}
          className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
          ← Change email
        </button>

        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/60 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
          <p className="font-medium">Two factors required to reset your password</p>
          <p className="text-xs opacity-90">
            A 6-digit code was sent to <strong>{maskedEmail}</strong> (expires in 10 min).
            You also need the current code from your authenticator app.
          </p>
        </div>

        {/* Factor 1: Email OTP */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
            Email code <span className="text-gray-400 dark:text-slate-500 font-normal">(sent to {maskedEmail})</span>
          </label>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={emailOtpCode}
            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-center font-mono tracking-widest text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            required autoFocus
          />
        </div>

        {/* Factor 2: TOTP */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
            Authenticator code <span className="text-gray-400 dark:text-slate-500 font-normal">(from your app)</span>
          </label>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-center font-mono tracking-widest text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            required
          />
        </div>

        {/* New password */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">New password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required minLength={10}
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Minimum 10 characters</p>
        </div>

        <LabeledInput label="Confirm new password" type={showPw ? "text" : "password"}
          value={confirmPw} onChange={setConfirmPw} required />

        {error && <ErrorMsg text={error} />}

        <button type="submit"
          disabled={busy || emailOtpCode.length < 6 || totpCode.length < 6 || newPw.length < 10 || !confirmPw}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
          {busy ? "Verifying…" : "Reset password"}
        </button>
      </form>
    );
  }

  // ── step: success ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-700/60 px-4 py-4 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-sm font-medium text-green-800 dark:text-green-200">Password reset successfully</p>
        <p className="text-xs text-green-700 dark:text-green-300 mt-1">All active sessions have been signed out. Sign in with your new password.</p>
      </div>
      <button onClick={onDone}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
        Back to sign in
      </button>
    </div>
  );
}

// ─── Contact support form ──────────────────────────────────────────────────────
function ContactSupportForm({ onBack }: { onBack: () => void }) {
  const [workEmail, setWorkEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/staff/auth/contact-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workEmail: workEmail.trim(), contactEmail: contactEmail.trim(), message }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Request failed"); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-700/60 px-4 py-5 text-center">
          <div className="text-2xl mb-2">✉</div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">Request submitted</p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1.5 leading-relaxed">
            An acknowledgement has been sent to <strong>{contactEmail}</strong>. Our team will be in touch shortly.
          </p>
        </div>
        <button onClick={onBack}
          className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium transition">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={onBack}
        className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
        ← Back to sign in
      </button>

      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
        Provide your details below and we'll reach out to help restore your access. You'll receive a confirmation email right away.
      </p>

      <LabeledInput
        label="Work / account email (optional)"
        type="email"
        value={workEmail}
        onChange={setWorkEmail}
        placeholder="you@mail.gaurav.one"
        autoFocus
      />

      <LabeledInput
        label="Contact email for this conversation *"
        type="email"
        value={contactEmail}
        onChange={setContactEmail}
        required
        placeholder="personal@gmail.com"
      />

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
          Describe your issue <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. I can't sign in, I forgot my password and don't have a recovery email set up…"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
        />
        <div className="text-right text-[11px] text-gray-400 mt-0.5">{message.length}/2000</div>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        You'll receive an acknowledgement email immediately at your contact email. A team member will follow up within 1 business day.
      </p>

      {error && <ErrorMsg text={error} />}

      <button type="submit" disabled={busy || !contactEmail}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
        {busy ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}

// ─── Shared sub-forms (unchanged) ─────────────────────────────────────────────
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
      <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
        First sign-in — please set a new password.
      </div>
      <LabeledInput label="New password" type="password" value={pw} onChange={setPw} required />
      <LabeledInput label="Confirm password" type="password" value={pw2} onChange={setPw2} required />
      {error && <ErrorMsg text={error} />}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}

function TwoFactorSetup({ me, onDone, onLogout }: { me: any; onDone: () => void; onLogout: () => void }) {
  const [picked, setPicked]         = useState<"TOTP" | "EMAIL_OTP" | "RESET_TOTP" | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const totpEnabled  = !!me?.twoFactor?.find((f: any) => f.method === "TOTP"      && f.enabled);
  const emailEnabled = !!me?.twoFactor?.find((f: any) => f.method === "EMAIL_OTP" && f.enabled);
  const bothEnabled  = totpEnabled && emailEnabled;
  const anyEnabled   = totpEnabled || emailEnabled;

  if (picked === "TOTP")       return <TotpEnroll onBack={() => setPicked(null)} onDone={onDone} />;
  if (picked === "EMAIL_OTP")  return <EmailOtpEnroll me={me} onBack={() => setPicked(null)} onDone={onDone} />;
  if (picked === "RESET_TOTP") return <TotpResetFlow onBack={() => setPicked(null)} onDone={() => { setPicked(null); onDone(); }} />;

  return (
    <div className="space-y-4">
      {/* Warning: only one method — can't self-reset password */}
      {anyEnabled && !bothEnabled && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 px-3 py-2.5 flex gap-2">
          <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Enable both methods for account recovery</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
              If you ever forget your password, you'll need <strong>both</strong> an authenticator app and email OTP to reset it yourself.
              With only one method, you'll have to contact your admin for a manual reset.
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-slate-300">
        Set up <strong>at least one</strong> factor. Enable both for full self-service account recovery.
      </p>
      <div className="space-y-2">
        <MethodCard title="Authenticator app (TOTP)" desc="Google Authenticator, 1Password, etc. — scan a QR code." enabled={totpEnabled} onClick={() => setPicked("TOTP")} />
        <MethodCard title="Email one-time code" desc="We send a 6-digit code to your email." enabled={emailEnabled} onClick={() => setPicked("EMAIL_OTP")} />
      </div>

      {/* TOTP reset option — shown only when TOTP is enabled and email OTP is also available */}
      {totpEnabled && emailEnabled && (
        <button
          type="button"
          onClick={() => setPicked("RESET_TOTP")}
          className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 transition text-xs text-gray-500 dark:text-slate-400"
        >
          Lost access to your authenticator? <span className="text-indigo-600 dark:text-indigo-400 font-medium">Reset TOTP →</span>
        </button>
      )}

      {anyEnabled && (
        <button onClick={onDone} className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-slate-800 text-white text-sm font-medium">
          Continue to mailbox
        </button>
      )}

      {/* Logout section */}
      <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
        {!confirmLogout ? (
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="w-full text-sm text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition py-1"
          >
            Sign out
          </button>
        ) : (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-700/60 px-4 py-3 space-y-2">
            <p className="text-sm text-red-700 dark:text-red-300 text-center">Sign out and cancel setup?</p>
            <div className="flex gap-2">
              <button
                onClick={onLogout}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
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

// ─── TOTP reset flow (password + email OTP → disable TOTP → re-enroll) ────────
function TotpResetFlow({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep]           = useState<"send" | "verify" | "success">("send");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showReEnroll, setShowReEnroll] = useState(false);

  async function sendOtp() {
    setBusy(true); setError(null);
    const res  = await fetch("/api/staff/auth/2fa/totp/reset");
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to send code"); return; }
    setMaskedEmail(data.maskedEmail);
    setStep("verify");
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res  = await fetch("/api/staff/auth/2fa/totp/reset", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword, emailOtpCode }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
    setStep("success");
  }

  if (step === "success" && showReEnroll) {
    return <TotpEnroll onBack={() => setShowReEnroll(false)} onDone={onDone} />;
  }

  if (step === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-700/60 px-4 py-4 text-center">
          <div className="text-2xl mb-2">✓</div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">Authenticator disabled</p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">Set up a new authenticator app now to keep your account secure.</p>
        </div>
        <button onClick={() => setShowReEnroll(true)}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
          Set up new authenticator →
        </button>
        <button onClick={onBack} className="w-full text-xs text-gray-400 dark:text-slate-500 hover:underline">
          Do it later
        </button>
      </div>
    );
  }

  if (step === "send") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
          ← Back
        </button>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Reset authenticator app</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            This will disable your current TOTP. You'll need your <strong>current password</strong> and a code sent to your <strong>2FA email</strong> to confirm.
          </p>
        </div>
        {error && <ErrorMsg text={error} />}
        <button onClick={sendOtp} disabled={busy}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-50">
          {busy ? "Sending code…" : "Send email verification code →"}
        </button>
      </div>
    );
  }

  // step === "verify"
  return (
    <form onSubmit={verifyAndReset} className="space-y-4">
      <button type="button" onClick={() => { setStep("send"); setError(null); }}
        className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
        ← Back
      </button>
      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/60 px-4 py-3 text-xs text-indigo-800 dark:text-indigo-200">
        Code sent to <strong>{maskedEmail}</strong>. Enter it below along with your current password.
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
          Email code <span className="text-gray-400 dark:text-slate-500 font-normal">(sent to {maskedEmail})</span>
        </label>
        <input
          type="text" inputMode="numeric" maxLength={6}
          value={emailOtpCode}
          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000" autoFocus required
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-center font-mono tracking-widest text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Current password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
          <button type="button" onClick={() => setShowPw((p) => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {error && <ErrorMsg text={error} />}

      <button type="submit" disabled={busy || emailOtpCode.length < 6 || !currentPassword}
        className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition disabled:opacity-50">
        {busy ? "Verifying…" : "Disable authenticator"}
      </button>
    </form>
  );
}

// ─── TOTP enrolment ────────────────────────────────────────────────────────────
function TotpEnroll({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [qr, setQr]         = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode]     = useState("");
  const [err, setErr]       = useState<string | null>(null);
  const [busy, setBusy]     = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/staff/auth/2fa/totp/setup", { method: "POST" })
      .then(async (r) => { const d = await r.json(); if (r.ok) { setQr(d.qrDataUrl); setSecret(d.secret); } });
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

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-500">← Back</button>
      <h3 className="font-medium text-gray-900 dark:text-white">Authenticator app</h3>
      {qr ? (
        <>
          {/* White background forced so QR is readable in both light and dark mode */}
          <div className="mx-auto w-fit p-3 bg-white rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
            <img src={qr} alt="QR code" width={200} height={200} />
          </div>

          {secret && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 text-center">
                Can't scan? Enter this key manually in your app
              </p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <code className="flex-1 text-xs font-mono text-gray-800 dark:text-slate-200 tracking-widest break-all">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  title="Copy secret key"
                  className="shrink-0 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <LabeledInput label="Enter 6-digit code from your app" value={code} onChange={setCode} required autoFocus />
          {err && <ErrorMsg text={err} />}
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

function EmailOtpEnroll({ me, onBack, onDone }: { me: any; onBack: () => void; onDone: () => void }) {
  const [stage, setStage] = useState<"SENDING" | "CONFIRM">("SENDING");
  const [target, setTarget] = useState(me?.staff?.recoveryEmail ?? "");
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
          Use a personal email you control — not your work mailbox. Pre-filled from the email your admin used when creating your account.
        </p>
        {err && <ErrorMsg text={err} />}
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
      {err && <ErrorMsg text={err} />}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Verifying…" : "Verify & enable"}
      </button>
    </form>
  );
}

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
      {err && <ErrorMsg text={err} />}
      <button type="submit" disabled={busy}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
        {busy ? "Verifying…" : "Continue"}
      </button>
    </form>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function LabeledInput({ label, type = "text", value, onChange, required, autoFocus, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  required?: boolean; autoFocus?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type} value={value} required={required} autoFocus={autoFocus} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
      />
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-700/60 rounded-lg px-3 py-2">
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{text}</span>
    </div>
  );
}
