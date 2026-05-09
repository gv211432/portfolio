import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
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

export function pdfS3Key(invoiceId: string): string {
  return `${INVOICE_ENV.S3_PREFIX}${invoiceId}.pdf`;
}

export async function uploadPdf(invoiceId: string, buffer: Buffer): Promise<string> {
  const key = pdfS3Key(invoiceId);
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

export async function signedPdfUrl(invoiceId: string, expiresInSec = 900): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: INVOICE_ENV.S3_BUCKET,
      Key: pdfS3Key(invoiceId),
      ResponseContentDisposition: `attachment; filename="invoice-${invoiceId}.pdf"`,
    }),
    { expiresIn: expiresInSec },
  );
}
