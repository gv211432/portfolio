/**
 * POST /api/admin/profile/change-email
 * In-session. Verifies TOTP + password, then sends OTP to the new email.
 * Body: { totpCode, password, newEmail }
 * After this, call POST /api/admin/profile/verify-change-email with { otp }.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { requireAdmin } from "@/lib/adminAuth";
import { sendAdminOtp } from "@/lib/admin/adminOtp";

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { totpCode, password, newEmail } = await req.json();
  if (!totpCode || !password || !newEmail) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { passwordHash: true, totpSecret: true, totpEnabled: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify password
  const pwValid = await bcrypt.compare(password, admin.passwordHash);
  if (!pwValid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  // Verify TOTP
  const totpValid = admin.totpEnabled && admin.totpSecret
    ? speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: totpCode.trim(), window: 1 })
    : false;
  if (!totpValid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

  // Stage new email and send OTP to it
  const email = newEmail.trim().toLowerCase();
  await prisma.adminUser.update({ where: { id: session.id }, data: { pendingNewEmail: email } });

  try {
    const { maskedEmail } = await sendAdminOtp(session.id, email, "change_email");
    return NextResponse.json({ sent: true, maskedEmail });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 429 });
  }
}
