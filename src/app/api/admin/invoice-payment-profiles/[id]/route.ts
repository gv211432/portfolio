import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { encryptOpt, decryptOpt } from "@/lib/invoice/encryption";

type Params = { params: Promise<{ id: string }> };

function decryptProfile(p: Awaited<ReturnType<typeof prisma.invoicePaymentProfile.findUniqueOrThrow>>) {
  return {
    id: p.id,
    label: p.label,
    isDefault: p.isDefault,
    currency: p.currency,
    branch: p.branch,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    accountName: decryptOpt(p.accountNameEnc),
    bankName: decryptOpt(p.bankNameEnc),
    accountNumber: decryptOpt(p.accountNumberEnc),
    ifscCode: decryptOpt(p.ifscCodeEnc),
    swiftCode: decryptOpt(p.swiftCodeEnc),
    upiId: decryptOpt(p.upiIdEnc),
    paypalOther: decryptOpt(p.paypalOtherEnc),
  };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    label, isDefault, currency, branch,
    accountName, bankName, accountNumber, ifscCode, swiftCode, upiId, paypalOther,
  } = body;

  const existing = await prisma.invoicePaymentProfile.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isDefault === true) {
    await prisma.invoicePaymentProfile.updateMany({ data: { isDefault: false } });
  }

  const updated = await prisma.invoicePaymentProfile.update({
    where: { id },
    data: {
      ...(label !== undefined && { label: label.trim() }),
      ...(isDefault !== undefined && { isDefault }),
      ...(currency !== undefined && { currency }),
      ...(branch !== undefined && { branch: branch?.trim() || null }),
      ...(accountName !== undefined && { accountNameEnc: encryptOpt(accountName) }),
      ...(bankName !== undefined && { bankNameEnc: encryptOpt(bankName) }),
      ...(accountNumber !== undefined && { accountNumberEnc: encryptOpt(accountNumber) }),
      ...(ifscCode !== undefined && { ifscCodeEnc: encryptOpt(ifscCode) }),
      ...(swiftCode !== undefined && { swiftCodeEnc: encryptOpt(swiftCode) }),
      ...(upiId !== undefined && { upiIdEnc: encryptOpt(upiId) }),
      ...(paypalOther !== undefined && { paypalOtherEnc: encryptOpt(paypalOther) }),
    },
  });

  return NextResponse.json({ profile: decryptProfile(updated) });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoicePaymentProfile.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prevent deleting default if others exist
  if (existing.isDefault) {
    const count = await prisma.invoicePaymentProfile.count();
    if (count > 1) {
      return NextResponse.json({ error: "Cannot delete default profile. Set another as default first." }, { status: 400 });
    }
  }

  await prisma.invoicePaymentProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
