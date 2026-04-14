/**
 * Centralised env getter for the mail platform.
 * Throws loudly at first use if required vars are missing — fail fast in prod.
 */

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[mail] Missing required env var: ${name}`);
  return v;
}

function opt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const MAIL_ENV = {
  get DOMAIN() { return must("MAIL_DOMAIN"); },
  get S3_BUCKET() { return must("MAIL_S3_BUCKET"); },
  get S3_INBOUND_PREFIX() { return opt("MAIL_S3_INBOUND_PREFIX", "inbound/"); },
  get S3_ATTACHMENT_PREFIX() { return opt("MAIL_S3_ATTACHMENT_PREFIX", "attachments/"); },
  get WEBHOOK_API_KEY() { return must("MAIL_WEBHOOK_API_KEY"); },
  get JWT_SECRET() { return must("STAFF_JWT_SECRET"); },
  get APP_ORIGIN() { return must("MAIL_APP_ORIGIN"); },
  get CONFIG_SET() { return opt("SES_CONFIGURATION_SET"); },
  get SYSTEM_FROM() { return must("MAIL_SYSTEM_FROM"); },

  // Reuse existing AWS credentials from SES block
  get AWS_REGION() { return opt("AWS_SES_REGION", "us-east-1"); },
  get AWS_KEY() { return must("AWS_SES_ACCESS_KEY_ID"); },
  get AWS_SECRET() { return must("AWS_SES_SECRET_ACCESS_KEY"); },
};
