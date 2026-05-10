import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/permissions";
import { encryptOpt, decryptOpt } from "@/lib/invoice/encryption";

function decryptProfile(p: Awaited<ReturnType<typeof prisma.invoicePaymentProfile.findMany>>[number]) {
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

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, "invoice_payment.list");
  if (!perm.ok) return perm.response;

  const profiles = await prisma.invoicePaymentProfile.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ profiles: profiles.map(decryptProfile) });
}

export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "invoice_payment.create");
  if (!perm.ok) return perm.response;

  const body = await req.json();
  const {
    label, isDefault = false, currency = "USD", branch,
    accountName, bankName, accountNumber, ifscCode, swiftCode, upiId, paypalOther,
  } = body;

  if (!label?.trim()) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  // If setting as default, unset others first
  if (isDefault) {
    await prisma.invoicePaymentProfile.updateMany({ data: { isDefault: false } });
  }

  const profile = await prisma.invoicePaymentProfile.create({
    data: {
      label: label.trim(),
      isDefault,
      currency,
      branch: branch?.trim() || null,
      accountNameEnc: encryptOpt(accountName),
      bankNameEnc: encryptOpt(bankName),
      accountNumberEnc: encryptOpt(accountNumber),
      ifscCodeEnc: encryptOpt(ifscCode),
      swiftCodeEnc: encryptOpt(swiftCode),
      upiIdEnc: encryptOpt(upiId),
      paypalOtherEnc: encryptOpt(paypalOther),
    },
  });

  return NextResponse.json({ profile: decryptProfile(profile) }, { status: 201 });
}
