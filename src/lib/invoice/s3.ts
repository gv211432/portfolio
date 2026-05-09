import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { INVOICE_ENV } from "./env";

let _client: S3Client | null = null;

function s3(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: INVOICE_ENV.S3_REGION,
    credentials: {
      accessKeyId: INVOICE_ENV.S3_KEY,
      secretAccessKey: INVOICE_ENV.S3_SECRET,
    },
  });
  return _client;
}

export function pdfS3Key(invoiceId: string, version?: number): string {
  if (version !== undefined) {
    return `${INVOICE_ENV.S3_PREFIX}${invoiceId}/v${version}.pdf`;
  }
  return `${INVOICE_ENV.S3_PREFIX}${invoiceId}/latest.pdf`;
}

export async function uploadPdf(invoiceId: string, buffer: Buffer, version?: number): Promise<string> {
  const key = pdfS3Key(invoiceId, version);
  await s3().send(
    new PutObjectCommand({
      Bucket: INVOICE_ENV.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    }),
  );
  return key;
}

export async function deletePdf(invoiceId: string): Promise<void> {
  await s3().send(
    new DeleteObjectCommand({
      Bucket: INVOICE_ENV.S3_BUCKET,
      Key: pdfS3Key(invoiceId),
    }),
  );
}

export async function downloadPdf(invoiceId: string): Promise<Buffer> {
  const res = await s3().send(
    new GetObjectCommand({ Bucket: INVOICE_ENV.S3_BUCKET, Key: pdfS3Key(invoiceId) }),
  );
  if (!res.Body) throw new Error(`[invoice-s3] empty body for ${invoiceId}`);
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as Readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

export async function signedPdfUrl(invoiceId: string, expiresInSec = 900, version?: number): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: INVOICE_ENV.S3_BUCKET,
      Key: pdfS3Key(invoiceId, version),
      ResponseContentDisposition: `attachment; filename="invoice-${invoiceId}${version !== undefined ? `-v${version}` : ""}.pdf"`,
    }),
    { expiresIn: expiresInSec },
  );
}

export async function downloadPdfVersion(invoiceId: string, version: number): Promise<Buffer> {
  const key = pdfS3Key(invoiceId, version);
  const res = await s3().send(new GetObjectCommand({ Bucket: INVOICE_ENV.S3_BUCKET, Key: key }));
  if (!res.Body) throw new Error(`[invoice-s3] empty body for ${key}`);
  const { Readable } = await import("node:stream");
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as InstanceType<typeof Readable>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}
