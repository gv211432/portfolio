/**
 * POST /api/admin/profile/recovery-codes
 * In-session. Regenerates the 8 TOTP recovery codes after TOTP verification.
 * Returns new plaintext codes once — store them securely.
 * Body: { totpCode }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/adminAuth";

function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const hex = randomBytes(6).toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 10)}`;
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { totpCode } = await req.json();
  if (!totpCode) return NextResponse.json({ error: "Authenticator code required" }, { status: 400 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  const totpValid = admin?.totpEnabled && admin.totpSecret
    ? speakeasy.totp.verify({ secret: admin.totpSecret, encoding: "base32", token: totpCode.trim(), window: 1 })
    : false;

  if (!totpValid) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });

  const plainCodes  = generateRecoveryCodes(8);
  const hashedCodes = await Promise.all(
    plainCodes.map(async (c) => ({ hash: await bcrypt.hash(c, 10), used: false }))
  );

  await prisma.adminUser.update({
    where: { id: session.id },
    data: { recoveryCodes: hashedCodes },
  });

  return NextResponse.json({ recoveryCodes: plainCodes });
}
