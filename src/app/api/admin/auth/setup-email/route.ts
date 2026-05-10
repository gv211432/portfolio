/**
 * POST /api/admin/auth/setup-email
 * First-login flow: send OTP to the provided recovery email.
 * Auth: emailSetupToken in body (issued after TOTP verify-setup).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSetupToken } from "@/lib/adminAuth";
import { sendAdminOtp } from "@/lib/admin/adminOtp";

export async function POST(req: NextRequest) {
  const { emailSetupToken, email } = await req.json();

  const adminId = await verifyEmailSetupToken(emailSetupToken);
  if (!adminId) {
    return NextResponse.json({ error: "Invalid or expired setup token" }, { status: 401 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
  }

  try {
    const { maskedEmail } = await sendAdminOtp(adminId, email.trim().toLowerCase(), "setup_email");
    return NextResponse.json({ sent: true, maskedEmail });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 429 });
  }
}
