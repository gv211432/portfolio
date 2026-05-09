/**
 * Invoice module seed script — company profile + primary payment profile.
 * Usage: bun run db:seed-invoice
 *
 * Required env vars:
 *   INVOICE_BANK_ENCRYPTION_KEY  — 64 hex chars (set in .env)
 *   DATABASE_URL                 — PostgreSQL connection string
 */

import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

// ─── Encryption (mirrors src/lib/invoice/encryption.ts) ──────────────────────

function getKey(): Buffer {
  const hex = process.env.INVOICE_BANK_ENCRYPTION_KEY;
  if (!hex) throw new Error("INVOICE_BANK_ENCRYPTION_KEY env var is required.");
  return Buffer.from(hex, "hex");
}

function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("hex"),
    ciphertext: ct.toString("hex"),
    tag: tag.toString("hex"),
  });
}

function encryptOpt(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return encrypt(value.trim());
}

// ─── Seed data ────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. Company Profile ──────────────────────────────────────────────────────
  const company = await prisma.invoiceCompanyProfile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      name: "Gaurav Dot One Software Solution Enterprises",
      address: [
        "7th Floor, Unit No 1171, 1172, Solitaire Corporate Park",
        "Andheri Ghatkopar Link Road, Chakala, Andheri East",
        "Mumbai, Maharashtra 400093, India",
      ].join("\n"),
      email: "hi@gaurav.one",
      phone: "+91 7977951858",
      website: "https://gaurav.one",
      gstNumber: "27BSZPV1508E1Z8",
      panNumber: null,
    },
    update: {
      name: "Gaurav Dot One Software Solution Enterprises",
      address: [
        "7th Floor, Unit No 1171, 1172, Solitaire Corporate Park",
        "Andheri Ghatkopar Link Road, Chakala, Andheri East",
        "Mumbai, Maharashtra 400093, India",
      ].join("\n"),
      email: "hi@gaurav.one",
      phone: "+91 7977951858",
      website: "https://gaurav.one",
      gstNumber: "27BSZPV1508E1Z8",
    },
  });

  console.log("✅ Company profile seeded");
  console.log(`   name  : ${company.name}`);
  console.log(`   email : ${company.email}`);
  console.log(`   GST   : ${company.gstNumber}`);

  // ── 2. Primary Payment Profile (Kotak Mahindra Bank) ───────────────────────
  //    Bank details are AES-256-GCM encrypted at rest.
  const existing = await prisma.invoicePaymentProfile.findFirst({
    where: { label: "Kotak Mahindra Bank — Primary" },
  });

  const paymentData = {
    label: "Kotak Mahindra Bank — Primary",
    isDefault: true,
    currency: "USD",
    branch: "Mumbai - Andheri East (MIDC Cross Road No. 21)",
    accountNameEnc: encryptOpt("GAURAV DOT ONE SOFTWARE SOLUTION ENTERPRISES"),
    bankNameEnc:    encryptOpt("Kotak Mahindra Bank Ltd"),
    accountNumberEnc: encryptOpt("7977951858"),
    ifscCodeEnc:    encryptOpt("KKBK0001367"),
    swiftCodeEnc:   encryptOpt("KKBKINBBCPC"),
    upiIdEnc:       null,
    paypalOtherEnc: null,
  };

  if (existing) {
    await prisma.invoicePaymentProfile.update({
      where: { id: existing.id },
      data: paymentData,
    });
    console.log("✅ Payment profile updated (existing record)");
  } else {
    // Unset any other defaults before creating
    await prisma.invoicePaymentProfile.updateMany({ data: { isDefault: false } });
    await prisma.invoicePaymentProfile.create({ data: paymentData });
    console.log("✅ Payment profile created");
  }

  console.log(`   label    : ${paymentData.label}`);
  console.log(`   currency : ${paymentData.currency}`);
  console.log(`   branch   : ${paymentData.branch}`);
  console.log(`   (bank details encrypted at rest)`);
}

main()
  .catch((err) => {
    console.error("Invoice seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
