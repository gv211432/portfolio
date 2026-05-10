/**
 * POST /api/admin/auth/forgot-password
 * Public — no session required.
 * Body: { username }
 * Sends OTP to the admin's verified recovery email.
 * Returns masked email on success (or generic message to avoid enumeration).
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminOtp } from "@/lib/admin/adminOtp";

const GENERIC_OK = { sent: true, maskedEmail: "***@***" }; // shown even if user not found

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username: username.trim() },
    select: { id: true, isActive: true, recoveryEmail: true, recoveryEmailVerified: true },
  });

  // Always return the same shape to prevent user enumeration
  if (!admin || !admin.isActive || !admin.recoveryEmailVerified || !admin.recoveryEmail) {
    // Artificial delay to prevent timing oracle
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json(GENERIC_OK);
  }

  try {
    const { maskedEmail } = await sendAdminOtp(admin.id, admin.recoveryEmail, "forgot_password");
    return NextResponse.json({ sent: true, maskedEmail });
  } catch (err) {
    // Rate-limit message is OK to surface
    return NextResponse.json({ error: (err as Error).message }, { status: 429 });
  }
}
