/**
 * POST /api/admin/profile/verify-change-email
 * In-session. Verifies OTP sent to the new email and commits the change.
 * Body: { otp }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { verifyAdminOtp } from "@/lib/admin/adminOtp";

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otp } = await req.json();
  if (!otp) return NextResponse.json({ error: "OTP required" }, { status: 400 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { pendingNewEmail: true },
  });
  if (!admin?.pendingNewEmail) {
    return NextResponse.json({ error: "No email change pending. Start from change-email." }, { status: 400 });
  }

  const otpResult = await verifyAdminOtp(session.id, otp.trim(), "change_email");
  if (otpResult === "expired") return NextResponse.json({ error: "Code expired. Start over." }, { status: 400 });
  if (otpResult === "locked")  return NextResponse.json({ error: "Too many attempts. Start over." }, { status: 429 });
  if (otpResult === "invalid") return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.adminUser.update({
    where: { id: session.id },
    data: {
      recoveryEmail:         admin.pendingNewEmail,
      recoveryEmailVerified: true,
      pendingNewEmail:       null,
    },
  });

  return NextResponse.json({ success: true, newEmail: admin.pendingNewEmail });
}
