/**
 * Trusted device management for staff 2FA.
 *
 * Security model:
 *   - After completing all required 2FA factors, a random opaque token is issued
 *     as a 7-day httpOnly cookie ("staff_device_token").
 *   - On subsequent logins from the same device, EMAIL_OTP is skipped.
 *     TOTP is always still required — we never drop below 1 factor.
 *   - The skip only activates when TOTP is also enrolled (guards against
 *     EMAIL_OTP-only users accidentally losing their only factor).
 *   - Trust is bound to staffId + browser family + OS family. A meaningfully
 *     different user-agent (e.g. Chrome→Firefox, macOS→Android) is treated as
 *     a new device and triggers full 2FA.
 *   - IP change is logged but does NOT revoke trust (mobile users, VPNs).
 *   - TOTP disable revokes ALL trusted devices for the staff.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import prisma from "@/lib/prisma";

export const DEVICE_COOKIE = "staff_device_token";
const DEVICE_TTL_MS        = 7 * 24 * 3600_000; // 7 days

// ── Token helpers ─────────────────────────────────────────────────────────────

export function generateDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── UA parsing ────────────────────────────────────────────────────────────────

function getBrowserFamily(ua: string): string {
  if (ua.includes("Firefox/"))                              return "Firefox";
  if (ua.includes("Edg/") || ua.includes("Edge/"))         return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera/"))        return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Chromium/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/"))   return "Safari";
  return "Unknown";
}

function getOsFamily(ua: string): string {
  if (ua.includes("iPhone"))   return "iPhone";
  if (ua.includes("iPad"))     return "iPad";
  if (ua.includes("Android"))  return "Android";
  if (ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Windows"))  return "Windows";
  if (ua.includes("Linux"))    return "Linux";
  return "Unknown";
}

export function parseDeviceLabel(ua: string): string {
  return `${getBrowserFamily(ua)} on ${getOsFamily(ua)}`;
}

function isSimilarUA(stored: string, current: string): boolean {
  // Same browser family + same OS family → treat as same device
  return (
    getBrowserFamily(stored) === getBrowserFamily(current) &&
    getOsFamily(stored)      === getOsFamily(current)
  );
}

// ── Core operations ───────────────────────────────────────────────────────────

interface VerifyResult {
  trusted:  boolean;
  deviceId?: string;
  tokenValue?: string; // pass-through so caller can refresh TTL
}

/**
 * Verify the device cookie from a request.
 * Returns { trusted: true, deviceId } if the device is valid and the
 * browser/OS family matches. Returns { trusted: false } otherwise.
 */
export async function verifyDeviceToken(
  staffId: string,
  req: NextRequest,
): Promise<VerifyResult> {
  const tokenValue = req.cookies.get(DEVICE_COOKIE)?.value;
  if (!tokenValue) return { trusted: false };

  const hash   = hashDeviceToken(tokenValue);
  const device = await prisma.staffTrustedDevice.findUnique({ where: { tokenHash: hash } });

  if (!device || device.staffId !== staffId)  return { trusted: false };
  if (device.expiresAt < new Date()) {
    await prisma.staffTrustedDevice.delete({ where: { id: device.id } }).catch(() => {});
    return { trusted: false };
  }

  // User-agent similarity check (advisory, not strictly revocable)
  const ua = req.headers.get("user-agent") ?? "";
  if (device.userAgent && !isSimilarUA(device.userAgent, ua)) {
    return { trusted: false };
  }

  return { trusted: true, deviceId: device.id, tokenValue };
}

/**
 * Called when a session reaches ACTIVE.
 * - If the device was already trusted (cookie present + valid): refresh TTL.
 * - If this is a new device (no valid cookie): create a trust record + set cookie.
 * Sets the `staff_device_token` cookie on the given NextResponse.
 */
export async function issueTrustCookie(
  staffId: string,
  req: NextRequest,
  res: NextResponse,
): Promise<void> {
  const existingVerify = await verifyDeviceToken(staffId, req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? null;
  const ua = req.headers.get("user-agent") ?? "";
  const expires = new Date(Date.now() + DEVICE_TTL_MS);

  if (existingVerify.trusted && existingVerify.deviceId && existingVerify.tokenValue) {
    // Refresh TTL in DB and on cookie
    await prisma.staffTrustedDevice.update({
      where: { id: existingVerify.deviceId },
      data:  { lastSeenAt: new Date(), expiresAt: expires, ipAddress: ip },
    });
    res.cookies.set(DEVICE_COOKIE, existingVerify.tokenValue, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/",
      expires,
    });
    return;
  }

  // New device — create record + set fresh cookie
  const token = generateDeviceToken();
  await prisma.staffTrustedDevice.create({
    data: {
      staffId,
      tokenHash: hashDeviceToken(token),
      label:     parseDeviceLabel(ua),
      ipAddress: ip,
      userAgent: ua,
      expiresAt: expires,
    },
  });

  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/",
    expires,
  });
}

/**
 * Revoke all trusted devices for a staff member (call when TOTP is disabled).
 * Also clears the device cookie from the current response if provided.
 */
export async function revokeAllTrustedDevices(
  staffId: string,
  res?: NextResponse,
): Promise<void> {
  await prisma.staffTrustedDevice.deleteMany({ where: { staffId } });
  if (res) {
    res.cookies.set(DEVICE_COOKIE, "", {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", path: "/", maxAge: 0,
    });
  }
}

/** Revoke a single device by ID (for settings UI). */
export async function revokeSingleDevice(id: string, staffId: string): Promise<boolean> {
  const result = await prisma.staffTrustedDevice.deleteMany({
    where: { id, staffId }, // staffId guard prevents cross-user revoke
  });
  return result.count > 0;
}

/** List all trusted devices for a staff member. */
export async function listTrustedDevices(staffId: string) {
  return prisma.staffTrustedDevice.findMany({
    where:   { staffId, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select:  { id: true, label: true, ipAddress: true, createdAt: true, lastSeenAt: true, expiresAt: true },
  });
}
