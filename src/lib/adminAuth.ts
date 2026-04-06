/**
 * Admin authentication utilities.
 * Uses jose for JWT (Edge-compatible) and httpOnly cookies.
 *
 * Required env var: ADMIN_JWT_SECRET (≥32 chars recommended)
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "change-me-in-production-use-32-char-secret!"
);

export interface AdminPayload {
  id: string;
  username: string;
}

export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ id: payload.id, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      username: payload.username as string,
    };
  } catch {
    return null;
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
 * Returns the current IST hour (0–23).
 * The admin path /admin/[hour] is valid only when [hour] === getISTHour().
 */
export function getISTHour(): number {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30
  const utcMs = Date.now();
  const istMs = utcMs + IST_OFFSET_MS;
  return new Date(istMs).getUTCHours();
}
