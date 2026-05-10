/**
 * Staff session helpers — DB-backed opaque token in an httpOnly cookie.
 *
 * We use DB sessions (not JWT) so admin can revoke a staff session instantly
 * and so the login state machine (SessionStage) is the source of truth.
 *
 * Cookie: `staff_session` = base64url(32 random bytes). DB stores sha256(token).
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { SessionStage, Staff, StaffSession } from "@prisma/client";

export const STAFF_COOKIE = "staff_session";
const SESSION_TTL_HOURS = 12;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface CreateSessionArgs {
  staffId: string;
  stage: SessionStage;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createStaffSession(args: CreateSessionArgs): Promise<string> {
  const token = newOpaqueToken();
  const expires = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000);
  await prisma.staffSession.create({
    data: {
      staffId: args.staffId,
      tokenHash: hashToken(token),
      stage: args.stage,
      expiresAt: expires,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
    },
  });
  return token;
}

export async function updateSessionStage(
  sessionId: string,
  stage: SessionStage,
): Promise<void> {
  await prisma.staffSession.update({ where: { id: sessionId }, data: { stage } });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.staffSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export interface ResolvedSession {
  session: StaffSession;
  staff: Staff;
}

async function resolveByToken(token: string | undefined): Promise<ResolvedSession | null> {
  if (!token) return null;
  const session = await prisma.staffSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { staff: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.staff.status !== "ACTIVE") return null;
  return { session, staff: session.staff };
}

/** Server component / route handler: read any session regardless of stage. */
export async function getStaffSession(): Promise<ResolvedSession | null> {
  const jar = await cookies();
  return resolveByToken(jar.get(STAFF_COOKIE)?.value);
}

/** Route handler: read any session from the NextRequest. */
export async function readStaffSession(req: NextRequest): Promise<ResolvedSession | null> {
  return resolveByToken(req.cookies.get(STAFF_COOKIE)?.value);
}

/** Require a fully authenticated (stage=ACTIVE) session. */
export async function requireActiveStaff(req: NextRequest): Promise<ResolvedSession | null> {
  const r = await readStaffSession(req);
  if (!r) return null;
  if (r.session.stage !== "ACTIVE") return null;
  return r;
}

export function setStaffCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_HOURS * 3600,
  });
  return res;
}

export function clearStaffCookie(res: NextResponse): NextResponse {
  res.cookies.set(STAFF_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/**
 * Decide the next login stage after password check, based on the staff's
 * current enrollment state. Called from /login AND after password reset AND
 * after each 2FA factor passes.
 */
export async function computeNextStage(
  staffId: string,
  passedFactors: Set<string>,
  opts?: {
    /**
     * Skip EMAIL_OTP challenge — only honoured when TOTP is also enrolled,
     * so the user always completes at least one factor.
     * Set this when the login comes from a recognised trusted device.
     */
    skipEmailOtp?: boolean;
  },
): Promise<SessionStage> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { twoFactor: true },
  });
  if (!staff) throw new Error("staff not found");

  if (staff.mustResetPassword) return "PENDING_PASSWORD_RESET";

  const enabled = staff.twoFactor.filter((f) => f.enabled);
  if (enabled.length === 0) return "PENDING_2FA_SETUP";

  const hasTotp = enabled.some((f) => f.method === "TOTP");
  const hasOtp  = enabled.some((f) => f.method === "EMAIL_OTP");

  if (hasTotp && !passedFactors.has("TOTP")) return "PENDING_TOTP";

  // Skip EMAIL_OTP only when: trusted device AND TOTP is also present
  // (prevents dropping to zero factors for EMAIL_OTP-only users)
  const emailOtpSkipped = opts?.skipEmailOtp && hasTotp;
  if (hasOtp && !passedFactors.has("EMAIL_OTP") && !emailOtpSkipped) return "PENDING_EMAIL_OTP";

  return "ACTIVE";
}

/** Client IP extractor (matches conventions elsewhere). */
export function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}
