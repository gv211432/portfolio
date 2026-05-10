/**
 * Admin authentication utilities.
 * Uses jose for JWT (Edge-compatible) and httpOnly cookies.
 *
 * Required env var: ADMIN_JWT_SECRET (≥32 chars recommended)
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

export const ADMIN_COOKIE = "admin_session";

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET env var is not set");
}
const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

export interface AdminPayload {
  id: string;
  username: string;
  jti: string;
}

export async function signAdminToken(payload: { id: string; username: string }): Promise<string> {
  const jti = randomUUID();
  return new SignJWT({ id: payload.id, username: payload.username, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const jti = payload.jti as string;
    if (!jti) return null;

    // Check revocation list (clean up expired entries as a side-effect)
    const now = new Date();
    const revoked = await prisma.adminRevokedToken.findUnique({ where: { jti } });
    if (revoked) return null;

    // Opportunistic cleanup of expired revocations (best-effort)
    prisma.adminRevokedToken.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => null);

    return {
      id:       payload.id as string,
      username: payload.username as string,
      jti,
    };
  } catch {
    return null;
  }
}

/** Revokes the jti embedded in a token so it cannot be used again. */
export async function revokeAdminToken(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const jti = payload.jti as string;
    const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 8 * 3600 * 1000);
    if (jti) {
      await prisma.adminRevokedToken.upsert({
        where:  { jti },
        create: { jti, expiresAt: exp },
        update: {},
      });
    }
  } catch {
    // Token may already be invalid — ignore
  }
}

/** Server Component helper — reads session from cookie store. */
export async function getAdminSession(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** Route handler helper — reads session from request cookies. */
export async function requireAdmin(request: NextRequest): Promise<AdminPayload | null> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function setAdminCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}

export function clearAdminCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Short-lived token issued after password verification but before TOTP.
 * Used to authenticate the TOTP setup/verify flow without granting a full session.
 */
export async function signSetupToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId, purpose: "totp_setup" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifySetupToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "totp_setup") return null;
    return payload.adminId as string;
  } catch {
    return null;
  }
}

/**
 * Token issued after TOTP is verified but before recovery email is set up.
 * Allows only the email-setup endpoints — no dashboard access.
 */
export async function signEmailSetupToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId, purpose: "email_setup" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secret);
}

export async function verifyEmailSetupToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "email_setup") return null;
    return payload.adminId as string;
  } catch {
    return null;
  }
}

/**
 * Token issued after forgot-password identity verification passes.
 * Allows only the password-reset endpoint.
 */
export async function signPasswordResetToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId, purpose: "password_reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "password_reset") return null;
    return payload.adminId as string;
  } catch {
    return null;
  }
}

/**
 * Returns the current IST hour (0–23).
 * The admin path /admin/[hour] is valid only when [hour] === getISTHour().
 */
export function getISTHour(): number {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30
  const utcMs = Date.now();
  const istMs = utcMs + IST_OFFSET_MS;
  return new Date(istMs).getUTCHours();
}
