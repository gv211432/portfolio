function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[invoice] Missing required env var: ${name}`);
  return v;
}

function opt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const INVOICE_ENV = {
  get BANK_KEY() { return must("INVOICE_BANK_ENCRYPTION_KEY"); },
  get S3_BUCKET() { return must("INVOICE_S3_BUCKET"); },
  get S3_PREFIX() { return opt("INVOICE_S3_PREFIX", "invoices/"); },
  get S3_REGION() { return opt("AWS_S3_REGION", process.env.AWS_SES_REGION ?? "us-east-1"); },
  get S3_KEY() { return opt("AWS_S3_ACCESS_KEY_ID", process.env.AWS_SES_ACCESS_KEY_ID ?? ""); },
  get S3_SECRET() { return opt("AWS_S3_SECRET_ACCESS_KEY", process.env.AWS_SES_SECRET_ACCESS_KEY ?? ""); },
};
