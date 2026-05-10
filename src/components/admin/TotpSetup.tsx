"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  setupToken: string;
  /** Called when the full setup (TOTP + email) is complete and a session is issued */
  onComplete: (username?: string) => void;
}

type Step = "qr" | "verify" | "recovery" | "email_setup" | "email_otp";

export default function TotpSetup({ setupToken, onComplete }: Props) {
  const [step, setStep]           = useState<Step>("qr");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret]       = useState("");
  const [totpCode, setTotpCode]   = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [emailSetupToken, setEmailSetupToken] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [emailOtp, setEmailOtp]   = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch QR on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res  = await fetch("/api/admin/totp/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupToken }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Setup failed"); return; }
        setQrDataUrl(data.qrDataUrl);
        setSecret(data.secret);
      } catch {
        setError("Network error. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setupToken]);

  // Auto-focus the code input when step changes to verify
  useEffect(() => {
    if (step === "verify") setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  async function handleVerify() {
    if (totpCode.replace(/\s/g, "").length < 6) return;
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/totp/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupToken, totpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Verification failed");
        setTotpCode("");
        return;
      }
      setRecoveryCodes(data.recoveryCodes);
      if (data.emailSetupToken) setEmailSetupToken(data.emailSetupToken);
      setStep("recovery");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadRecoveryCodes() {
    const text = [
      "Gaurav.One Admin — Recovery Codes",
      "Generated: " + new Date().toLocaleString(),
      "Each code can only be used once.",
      "",
      ...recoveryCodes,
      "",
      "Store these somewhere safe. You will not see them again.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "gaurav-admin-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── shared shell ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0 0V7m0 4v4m-6 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Two-Factor Auth</h1>
          <p className="text-slate-400 text-sm mt-1">Secure your admin account</p>
        </div>

        {/* step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["qr", "verify", "recovery", "email_setup"] as Step[]).map((s, i) => {
            const ALL: Step[] = ["qr", "verify", "recovery", "email_setup", "email_otp"];
            const currentIdx = ALL.indexOf(step);
            const thisIdx    = ALL.indexOf(s);
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentIdx === thisIdx
                    ? "bg-indigo-600 text-white"
                    : currentIdx > thisIdx
                      ? "bg-green-600 text-white"
                      : "bg-slate-800 text-slate-500"
                }`}>
                  {currentIdx > thisIdx ? "✓" : i + 1}
                </div>
                {i < 3 && <div className={`w-6 h-0.5 ${currentIdx > thisIdx ? "bg-green-600" : "bg-slate-800"}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800">

          {/* ── Step 1: QR ── */}
          {step === "qr" && (
            <div>
              <h2 className="text-white font-semibold mb-1">Scan with your authenticator</h2>
              <p className="text-slate-400 text-xs mb-4">Use Google Authenticator, Authy, or any TOTP app.</p>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <p className="text-red-400 text-sm">{error}</p>
              ) : (
                <>
                  {/* QR code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-xl inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="TOTP QR code" width={200} height={200} />
                    </div>
                  </div>

                  {/* Manual entry */}
                  <div className="mb-4">
                    <p className="text-slate-500 text-xs mb-1.5">Can't scan? Enter this key manually:</p>
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                      <code className="flex-1 text-xs text-indigo-300 font-mono tracking-widest break-all">
                        {secretVisible ? secret : "•".repeat(secret.length)}
                      </code>
                      <button
                        onClick={() => setSecretVisible((v) => !v)}
                        className="text-slate-500 hover:text-slate-300 transition shrink-0"
                        title={secretVisible ? "Hide" : "Reveal"}
                      >
                        {secretVisible
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                      <button onClick={copySecret} className="text-slate-500 hover:text-indigo-400 transition shrink-0" title="Copy">
                        {copied
                          ? <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => { setError(""); setStep("verify"); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition"
                  >
                    I've scanned the QR code →
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Verify ── */}
          {step === "verify" && (
            <div>
              <h2 className="text-white font-semibold mb-1">Enter the 6-digit code</h2>
              <p className="text-slate-400 text-xs mb-5">Open your authenticator app and enter the current code to confirm setup.</p>

              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                maxLength={7}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="000000"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setError(""); setStep("qr"); }}
                  className="flex-1 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 font-medium rounded-lg py-2.5 text-sm transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading || totpCode.length < 6}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition"
                >
                  {loading ? "Verifying…" : "Verify"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Recovery codes ── */}
          {step === "recovery" && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-white font-semibold">2FA Enabled!</h2>
              </div>
              <p className="text-slate-400 text-xs mb-4">
                Save these recovery codes somewhere safe. Each can be used <strong className="text-slate-300">once</strong> instead of your authenticator if you lose access.
              </p>

              <div className="bg-slate-800 rounded-xl p-3 mb-4 grid grid-cols-2 gap-1.5">
                {recoveryCodes.map((code) => (
                  <code key={code} className="text-indigo-300 font-mono text-xs text-center py-1 bg-slate-900/50 rounded-lg">
                    {code}
                  </code>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={downloadRecoveryCodes}
                  className="w-full flex items-center justify-center gap-2 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-medium rounded-lg py-2.5 text-sm transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Recovery Codes
                </button>
                <button
                  onClick={() => { setError(""); setStep("email_setup"); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition"
                >
                  Continue — Set Up Recovery Email →
                </button>
              </div>

              <p className="text-center text-slate-600 text-xs mt-3">
                You will not be able to view these codes again.
              </p>
            </div>
          )}

          {/* ── Step 4: Recovery Email Entry ── */}
          {step === "email_setup" && (
            <div>
              <h2 className="text-white font-semibold mb-1">Set up recovery email</h2>
              <p className="text-slate-400 text-xs mb-5">
                A personal email used for account recovery and security verifications. A code will be sent to confirm it.
              </p>
              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="your@personal-email.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-4"
                autoComplete="email"
              />
              <button
                onClick={async () => {
                  setError(""); setLoading(true);
                  try {
                    const res  = await fetch("/api/admin/auth/setup-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ emailSetupToken, email: recoveryEmail }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setError(data.error ?? "Failed to send code"); return; }
                    setMaskedEmail(data.maskedEmail);
                    setOtpSent(true);
                    setStep("email_otp");
                  } catch { setError("Network error"); }
                  finally { setLoading(false); }
                }}
                disabled={loading || !recoveryEmail.includes("@")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {loading ? "Sending…" : "Send Verification Code →"}
              </button>
            </div>
          )}

          {/* ── Step 5: Email OTP ── */}
          {step === "email_otp" && (
            <div>
              <h2 className="text-white font-semibold mb-1">Verify your email</h2>
              <p className="text-slate-400 text-xs mb-5">
                Enter the 6-digit code sent to <strong className="text-slate-300">{maskedEmail}</strong>. Expires in 10 minutes.
              </p>
              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-4"
              />
              <button
                onClick={async () => {
                  setError(""); setLoading(true);
                  try {
                    const res  = await fetch("/api/admin/auth/verify-setup-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ emailSetupToken, email: recoveryEmail, otp: emailOtp }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) { setError(data.error ?? "Verification failed"); return; }
                    onComplete(data.username);
                  } catch { setError("Network error"); }
                  finally { setLoading(false); }
                }}
                disabled={loading || emailOtp.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {loading ? "Verifying…" : "Verify & Enter Dashboard →"}
              </button>
              <button
                onClick={() => { setStep("email_setup"); setEmailOtp(""); setError(""); setOtpSent(false); }}
                className="w-full mt-2 text-slate-500 hover:text-slate-300 text-xs transition"
              >
                ← Change email address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
