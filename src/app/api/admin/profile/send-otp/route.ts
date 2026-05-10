/**
 * POST /api/admin/profile/send-otp
 * In-session: send an email OTP for account security operations.
 * Body: { purpose: "change_password" | "change_email" }
 * The OTP is sent to the admin's verified recovery email.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { sendAdminOtp, OtpPurpose } from "@/lib/admin/adminOtp";

const ALLOWED_PURPOSES: OtpPurpose[] = ["change_password", "change_email"];

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { purpose } = await req.json();
  if (!ALLOWED_PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { recoveryEmail: true, recoveryEmailVerified: true },
  });

  if (!admin?.recoveryEmailVerified || !admin.recoveryEmail) {
    return NextResponse.json({ error: "No verified recovery email on file" }, { status: 400 });
  }

  try {
    const { maskedEmail } = await sendAdminOtp(session.id, admin.recoveryEmail, purpose);
    return NextResponse.json({ sent: true, maskedEmail });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 429 });
  }
}
