import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { INVOICE_ENV } from "./env";

interface EncryptedBlob {
  iv: string;
  ciphertext: string;
  tag: string;
}

function getKey(): Buffer {
  return Buffer.from(INVOICE_ENV.BANK_KEY, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob: EncryptedBlob = {
    iv: iv.toString("hex"),
    ciphertext: ct.toString("hex"),
    tag: tag.toString("hex"),
  };
  return JSON.stringify(blob);
}

export function decrypt(stored: string): string {
  const key = getKey();
  const { iv, ciphertext, tag } = JSON.parse(stored) as EncryptedBlob;
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return decipher.update(Buffer.from(ciphertext, "hex")) + decipher.final("utf8");
}

export function encryptOpt(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;
  return encrypt(value.trim());
}

export function decryptOpt(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    return decrypt(stored);
  } catch {
    return null;
  }
}
