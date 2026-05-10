"use client";

/**
 * MailSettings — full-screen settings modal for staff webmail.
 * Tabs: Profile · Password · Two-Factor Auth · Appearance
 */

import { useEffect, useState } from "react";
import {
  X, User, Lock, Shield, Palette, Check, AlertTriangle,
  Eye, EyeOff, Smartphone, Mail, Loader2, ChevronRight,
  Monitor, Trash2,
} from "lucide-react";

interface Me {
  displayName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface Props {
  me: Me;
  onClose: () => void;
  onDirChange: (dir: "ltr" | "rtl") => void;
}

type Tab = "profile" | "password" | "2fa" | "appearance";

interface ProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  recoveryEmail: string;
}

interface TwoFactorStatus {
  totp: boolean;
  emailOtp: boolean;
  emailOtpTarget?: string;
}

type TotpStep = "idle" | "setup" | "recovery" | "regenerate";
type EmailOtpStep = "idle" | "setup" | "verify";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-36 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

function StatusBadge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      ok ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
         : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
    }`}>
      {ok && <Check size={10} />}
      {text}
    </span>
  );
}

export default function MailSettings({ me, onClose, onDirChange }: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>({ firstName: "", lastName: "", displayName: "", recoveryEmail: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Password ─────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── 2FA ──────────────────────────────────────────────────────────────────
  const [twoFa, setTwoFa] = useState<TwoFactorStatus>({ totp: false, emailOtp: false });
  const [twoFaLoading, setTwoFaLoading] = useState(true);

  // TOTP setup flow
  const [totpStep, setTotpStep]         = useState<TotpStep>("idle");
  const [totpQr, setTotpQr]             = useState("");
  const [totpSecret, setTotpSecret]     = useState("");
  const [totpCode, setTotpCode]         = useState("");
  const [totpBusy, setTotpBusy]         = useState(false);
  const [totpMsg, setTotpMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [regenCode, setRegenCode]       = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  // Email OTP setup flow
  const [emailStep, setEmailStep] = useState<EmailOtpStep>("idle");
  const [emailTarget, setEmailTarget] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Appearance ────────────────────────────────────────────────────────────
  const [dir, setDirState] = useState<"ltr" | "rtl">("ltr");

  // Load profile + 2FA status on mount
  useEffect(() => {
    fetch("/api/staff/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.staff) {
          setProfile({
            firstName: data.staff.firstName ?? "",
            lastName: data.staff.lastName ?? "",
            displayName: data.staff.displayName ?? "",
            recoveryEmail: "",
          });
        }
        if (data.twoFactor) {
          const totp = data.twoFactor.find((f: { method: string }) => f.method === "TOTP");
          const emailOtp = data.twoFactor.find((f: { method: string }) => f.method === "EMAIL_OTP");
          setTwoFa({
            totp: totp?.enabled ?? false,
            emailOtp: emailOtp?.enabled ?? false,
            emailOtpTarget: emailOtp?.otpTargetEmail ?? undefined,
          });
        }
      })
      .finally(() => { setProfileLoading(false); setTwoFaLoading(false); });

    // Load recovery email separately (not returned by /me for security)
    const savedDir = localStorage.getItem("mail_layout_dir") as "ltr" | "rtl" | null;
    if (savedDir) setDirState(savedDir);
  }, []);

  // ── Profile save ──────────────────────────────────────────────────────────
  async function saveProfile() {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/staff/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          ...(profile.recoveryEmail ? { recoveryEmail: profile.recoveryEmail } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ ok: false, text: data.error ?? "Save failed" });
      } else {
        setProfileMsg({ ok: true, text: "Profile updated" });
      }
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Password change ───────────────────────────────────────────────────────
  async function changePassword() {
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    if (newPw.length < 10) {
      setPwMsg({ ok: false, text: "Password must be at least 10 characters" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/staff/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ ok: false, text: data.error ?? "Failed to change password" });
      } else {
        setPwMsg({ ok: true, text: "Password changed successfully" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } finally {
      setPwSaving(false);
    }
  }

  // ── TOTP setup ────────────────────────────────────────────────────────────
  async function startTotpSetup() {
    setTotpBusy(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/totp/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setTotpMsg({ ok: false, text: data.error ?? "Setup failed" }); return; }
      setTotpQr(data.qrDataUrl);
      setTotpSecret(data.secret);
      setTotpStep("setup");
    } finally {
      setTotpBusy(false);
    }
  }

  async function verifyTotp() {
    setTotpBusy(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/totp/verify-setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: totpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setTotpMsg({ ok: false, text: data.error ?? "Invalid code" }); return; }
      setTwoFa((p) => ({ ...p, totp: true }));
      setTotpCode("");
      if (data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        setTotpStep("recovery");
      } else {
        setTotpStep("idle");
        setTotpMsg({ ok: true, text: "TOTP enabled" });
      }
    } finally {
      setTotpBusy(false);
    }
  }

  async function disableTotp() {
    setTotpBusy(true);
    setTotpMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/totp/disable", { method: "POST" });
      if (!res.ok) { setTotpMsg({ ok: false, text: "Failed to disable" }); return; }
      setTwoFa((p) => ({ ...p, totp: false }));
      setRecoveryCodes([]);
      setTotpMsg({ ok: true, text: "TOTP disabled" });
    } finally {
      setTotpBusy(false);
    }
  }

  // ── Email OTP setup ───────────────────────────────────────────────────────
  async function startEmailOtp() {
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/email/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(emailTarget ? { targetEmail: emailTarget } : {}),
      });
      const data = await res.json();
      if (!res.ok) { setEmailMsg({ ok: false, text: data.error ?? "Setup failed" }); return; }
      setEmailTarget(data.targetEmail ?? emailTarget);
      setEmailStep("verify");
      setEmailMsg({ ok: true, text: `OTP sent to ${data.targetEmail}` });
    } finally {
      setEmailBusy(false);
    }
  }

  async function verifyEmailOtp() {
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/email/verify-setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: emailCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setEmailMsg({ ok: false, text: data.error ?? "Invalid code" }); return; }
      setTwoFa((p) => ({ ...p, emailOtp: true, emailOtpTarget: emailTarget }));
      setEmailStep("idle");
      setEmailCode("");
      setEmailMsg({ ok: true, text: "Email OTP enabled" });
    } finally {
      setEmailBusy(false);
    }
  }

  async function disableEmailOtp() {
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/staff/auth/2fa/email/disable", { method: "POST" });
      if (!res.ok) { setEmailMsg({ ok: false, text: "Failed to disable" }); return; }
      setTwoFa((p) => ({ ...p, emailOtp: false, emailOtpTarget: undefined }));
      setEmailMsg({ ok: true, text: "Email OTP disabled" });
    } finally {
      setEmailBusy(false);
    }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <User size={15} /> },
    { key: "password", label: "Password", icon: <Lock size={15} /> },
    { key: "2fa", label: "Two-Factor", icon: <Shield size={15} /> },
    { key: "appearance", label: "Appearance", icon: <Palette size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#161616] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex-1">Account Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tab sidebar */}
          <nav className="w-40 shrink-0 border-r border-gray-200 dark:border-gray-800 py-3 flex flex-col gap-0.5 px-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition ${
                  tab === t.key
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <span className={tab === t.key ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── Profile ─────────────────────────────────────────── */}
            {tab === "profile" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Profile</h3>
                  <p className="text-xs text-gray-500">Your name and recovery email address.</p>
                </div>

                {profileLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FieldRow label="First name">
                      <Input value={profile.firstName} onChange={(v) => setProfile((p) => ({ ...p, firstName: v }))} />
                    </FieldRow>
                    <FieldRow label="Last name">
                      <Input value={profile.lastName} onChange={(v) => setProfile((p) => ({ ...p, lastName: v }))} />
                    </FieldRow>
                    <FieldRow label="Display name">
                      <Input
                        value={profile.displayName}
                        onChange={(v) => setProfile((p) => ({ ...p, displayName: v }))}
                        placeholder={`${profile.firstName} ${profile.lastName}`}
                      />
                    </FieldRow>
                    <FieldRow label="Work email">
                      <Input value={me.email} onChange={() => {}} disabled />
                    </FieldRow>
                    <FieldRow label="Recovery email">
                      <Input
                        value={profile.recoveryEmail}
                        onChange={(v) => setProfile((p) => ({ ...p, recoveryEmail: v }))}
                        placeholder="personal@example.com"
                        type="email"
                      />
                    </FieldRow>
                  </div>
                )}

                {profileMsg && (
                  <Msg ok={profileMsg.ok} text={profileMsg.text} />
                )}

                <button
                  onClick={saveProfile}
                  disabled={profileSaving || profileLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition"
                >
                  {profileSaving && <Loader2 size={14} className="animate-spin" />}
                  Save changes
                </button>
              </div>
            )}

            {/* ── Password ────────────────────────────────────────── */}
            {tab === "password" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Change Password</h3>
                  <p className="text-xs text-gray-500">Must be at least 10 characters.</p>
                </div>

                <div className="space-y-3">
                  <FieldRow label="Current password">
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FieldRow>
                  <FieldRow label="New password">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                    />
                  </FieldRow>
                  <FieldRow label="Confirm password">
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                    />
                  </FieldRow>
                </div>

                {pwMsg && <Msg ok={pwMsg.ok} text={pwMsg.text} />}

                <button
                  onClick={changePassword}
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition"
                >
                  {pwSaving && <Loader2 size={14} className="animate-spin" />}
                  Update password
                </button>
              </div>
            )}

            {/* ── 2FA ─────────────────────────────────────────────── */}
            {tab === "2fa" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                </div>

                {twoFaLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    {/* ── TOTP ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                            <Smartphone size={18} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Authenticator App (TOTP)</div>
                            <div className="text-xs text-gray-500">Google Authenticator, Authy, etc.</div>
                          </div>
                        </div>
                        <StatusBadge ok={twoFa.totp} text={twoFa.totp ? "Enabled" : "Not set up"} />
                      </div>

                      {totpStep === "idle" && (
                        <div className="flex gap-2">
                          {twoFa.totp ? (
                            <button
                              onClick={disableTotp}
                              disabled={totpBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                            >
                              {totpBusy ? <Loader2 size={12} className="animate-spin" /> : null}
                              Disable TOTP
                            </button>
                          ) : (
                            <button
                              onClick={startTotpSetup}
                              disabled={totpBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                            >
                              {totpBusy ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                              Set up TOTP
                            </button>
                          )}
                        </div>
                      )}

                      {totpStep === "setup" && (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Scan this QR code with your authenticator app, then enter the 6-digit code below.
                          </p>
                          {totpQr && (
                            <div className="flex gap-4 items-start flex-wrap">
                              {/* White background so QR is readable in light + dark mode */}
                              <div className="p-2 bg-white rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
                                <img src={totpQr} alt="TOTP QR code" className="w-32 h-32" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Can't scan? Enter this key manually:</div>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                                  <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                                    {totpSecret}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(totpSecret);
                                      setSecretCopied(true);
                                      setTimeout(() => setSecretCopied(false), 2000);
                                    }}
                                    title="Copy secret"
                                    className="shrink-0 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                  >
                                    {secretCopied
                                      ? <Check size={13} className="text-green-500" />
                                      : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    }
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="6-digit code"
                              className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                            />
                            <button onClick={verifyTotp} disabled={totpBusy || totpCode.length < 6}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition">
                              {totpBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Verify
                            </button>
                            <button onClick={() => { setTotpStep("idle"); setTotpCode(""); setTotpMsg(null); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Recovery codes — shown once immediately after TOTP is verified */}
                      {totpStep === "recovery" && (
                        <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Save your recovery codes now</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                                These 8 codes are shown <strong>only once</strong>. Each can be used once to sign in if you lose your authenticator. Store them in a password manager or print them.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {recoveryCodes.map((c) => (
                              <code key={c} className="text-center text-xs font-mono bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800/50 rounded-md py-1.5 text-gray-800 dark:text-gray-200 select-all">
                                {c}
                              </code>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const text = ["Webmail TOTP Recovery Codes", `Generated: ${new Date().toLocaleString()}`, "Each code can only be used once.", "", ...recoveryCodes].join("\n");
                                const a = document.createElement("a");
                                a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
                                a.download = "recovery-codes.txt"; a.click();
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                            >
                              Download .txt
                            </button>
                            <button
                              type="button"
                              onClick={() => { setTotpStep("idle"); setRecoveryCodes([]); setTotpMsg({ ok: true, text: "TOTP enabled — recovery codes saved" }); }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
                            >
                              <Check size={12} /> Done, I've saved them
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Regenerate recovery codes — shown when TOTP is enabled and idle */}
                      {totpStep === "idle" && twoFa.totp && (
                        <div className="pt-1">
                          {totpStep === "idle" && !recoveryCodes.length && (
                            <>
                              {/* Inline regenerate button */}
                              <button
                                type="button"
                                onClick={() => { setTotpStep("regenerate"); setRegenCode(""); setTotpMsg(null); }}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition"
                              >
                                Regenerate recovery codes
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {totpStep === "regenerate" && (
                        <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Enter your current authenticator code to regenerate recovery codes. This will invalidate all existing codes.</p>
                          <div className="flex gap-2">
                            <input
                              type="text" inputMode="numeric" maxLength={6}
                              value={regenCode}
                              onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="6-digit code"
                              className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                            />
                            <button
                              disabled={totpBusy || regenCode.length < 6}
                              onClick={async () => {
                                setTotpBusy(true); setTotpMsg(null);
                                try {
                                  const res = await fetch("/api/staff/auth/2fa/totp/recovery-codes", {
                                    method: "POST",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ totpCode: regenCode }),
                                  });
                                  const d = await res.json();
                                  if (!res.ok) { setTotpMsg({ ok: false, text: d.error ?? "Failed" }); return; }
                                  setRecoveryCodes(d.recoveryCodes);
                                  setTotpStep("recovery");
                                  setRegenCode("");
                                } finally { setTotpBusy(false); }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition"
                            >
                              {totpBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Regenerate
                            </button>
                            <button
                              onClick={() => { setTotpStep("idle"); setRegenCode(""); setTotpMsg(null); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >Cancel</button>
                          </div>
                        </div>
                      )}

                      {totpMsg && <Msg ok={totpMsg.ok} text={totpMsg.text} />}
                    </div>

                    {/* ── Email OTP ── */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                            <Mail size={18} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Email OTP</div>
                            <div className="text-xs text-gray-500">
                              {twoFa.emailOtpTarget ? `Sends to: ${twoFa.emailOtpTarget}` : "One-time code via email"}
                            </div>
                          </div>
                        </div>
                        <StatusBadge ok={twoFa.emailOtp} text={twoFa.emailOtp ? "Enabled" : "Not set up"} />
                      </div>

                      {emailStep === "idle" && (
                        <div className="flex gap-2">
                          {twoFa.emailOtp ? (
                            <button
                              onClick={disableEmailOtp}
                              disabled={emailBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                            >
                              {emailBusy ? <Loader2 size={12} className="animate-spin" /> : null}
                              Disable Email OTP
                            </button>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              <input
                                type="email"
                                value={emailTarget}
                                onChange={(e) => setEmailTarget(e.target.value)}
                                placeholder="email@example.com (optional)"
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition w-56"
                              />
                              <button
                                onClick={startEmailOtp}
                                disabled={emailBusy}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                              >
                                {emailBusy ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                                Send code
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {emailStep === "verify" && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Enter the code sent to <strong>{emailTarget}</strong>.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={8}
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="OTP code"
                              className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                            />
                            <button
                              onClick={verifyEmailOtp}
                              disabled={emailBusy || emailCode.length < 4}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition"
                            >
                              {emailBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Verify
                            </button>
                            <button
                              onClick={() => { setEmailStep("idle"); setEmailCode(""); setEmailMsg(null); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {emailMsg && <Msg ok={emailMsg.ok} text={emailMsg.text} />}
                    </div>

                    {/* ── Trusted Devices ── */}
                    <TrustedDevicesPanel />
                  </>
                )}
              </div>
            )}

            {/* ── Appearance ──────────────────────────────────────── */}
            {tab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Appearance</h3>
                  <p className="text-xs text-gray-500">Customize how the mail interface looks.</p>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Text direction</div>
                  <div className="flex gap-3">
                    {(["ltr", "rtl"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDirState(d);
                          onDirChange(d);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition ${
                          dir === d
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="text-lg mb-1">{d === "ltr" ? "←→" : "→←"}</div>
                        <div>{d === "ltr" ? "Left-to-Right (LTR)" : "Right-to-Left (RTL)"}</div>
                        {d === "rtl" && <div className="text-[11px] text-gray-400 mt-0.5">Arabic, Hebrew, etc.</div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
      ok
        ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
        : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
    }`}>
      {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      {text}
    </div>
  );
}

// ─── Trusted devices panel ─────────────────────────────────────────────────────

interface TrustedDevice {
  id: string;
  label: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function relTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TrustedDevicesPanel() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff/auth/devices")
      .then((r) => r.json())
      .then((d) => { if (d.devices) setDevices(d.devices); })
      .finally(() => setLoading(false));
  }, []);

  async function revoke(id: string) {
    setRevoking(id);
    await fetch(`/api/staff/auth/devices/${id}`, { method: "DELETE" });
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setRevoking(null);
  }

  async function revokeAll() {
    if (!confirm("Remove all trusted devices? You'll need to complete full 2FA on every device next time.")) return;
    setLoading(true);
    await fetch("/api/staff/auth/devices", { method: "DELETE" });
    setDevices([]);
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
      <Loader2 size={13} className="animate-spin" /> Loading trusted devices…
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Monitor size={16} className="text-gray-400" />
            Trusted Devices
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Recognised devices skip the email OTP step — TOTP is still always required.
          </p>
        </div>
        {devices.length > 1 && (
          <button
            onClick={revokeAll}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
          >
            Revoke all
          </button>
        )}
      </div>

      {devices.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          No trusted devices yet. After completing full 2FA on a device, it will appear here (7-day trust window).
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {devices.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <Monitor size={14} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {d.label ?? "Unknown device"}
                    </span>
                    {d.isCurrent && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 space-x-2">
                    {d.ipAddress && <span>{d.ipAddress}</span>}
                    <span>· Last seen {relTime(d.lastSeenAt)}</span>
                    <span>· Expires {relTime(new Date(d.expiresAt).getTime() > Date.now()
                      ? new Date(d.expiresAt).toLocaleDateString()
                      : "expired")}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => revoke(d.id)}
                disabled={revoking === d.id}
                title="Remove this trusted device"
                className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition disabled:opacity-40"
              >
                {revoking === d.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
