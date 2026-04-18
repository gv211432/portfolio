"use client";

/**
 * MailSettings — full-screen settings modal for staff webmail.
 * Tabs: Profile · Password · Two-Factor Auth · Appearance
 */

import { useEffect, useState } from "react";
import {
  X, User, Lock, Shield, Palette, Check, AlertTriangle,
  Eye, EyeOff, Smartphone, Mail, Loader2, ChevronRight,
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

type TotpStep = "idle" | "setup" | "verify";
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
  const [totpStep, setTotpStep] = useState<TotpStep>("idle");
  const [totpQr, setTotpQr] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpMsg, setTotpMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
      setTotpStep("idle");
      setTotpCode("");
      setTotpMsg({ ok: true, text: "TOTP enabled" });
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
                            <div className="flex gap-4 items-start">
                              <img src={totpQr} alt="TOTP QR code" className="w-36 h-36 rounded-lg border border-gray-200 dark:border-gray-700" />
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Manual entry key:</div>
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md break-all select-all font-mono">
                                  {totpSecret}
                                </code>
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                              placeholder="6-digit code"
                              className="w-36 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                            />
                            <button
                              onClick={verifyTotp}
                              disabled={totpBusy || totpCode.length < 6}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition"
                            >
                              {totpBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Verify
                            </button>
                            <button
                              onClick={() => { setTotpStep("idle"); setTotpCode(""); setTotpMsg(null); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                              Cancel
                            </button>
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
