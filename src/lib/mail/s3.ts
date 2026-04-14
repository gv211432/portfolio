/**
 * S3 client + helpers for the mail platform.
 *
 * Raw .eml files: written by SES at MAIL_S3_INBOUND_PREFIX.
 * Attachments:   written by Lambda at MAIL_S3_ATTACHMENT_PREFIX.
 * Both live in the same bucket (MAIL_S3_BUCKET).
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { MAIL_ENV } from "./env";

let _client: S3Client | null = null;

export function s3(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: MAIL_ENV.S3_REGION,
    credentials: {
      accessKeyId: MAIL_ENV.S3_KEY,
      secretAccessKey: MAIL_ENV.S3_SECRET,
    },
  });
  return _client;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3().send(new GetObjectCommand({ Bucket: MAIL_ENV.S3_BUCKET, Key: key }));
  if (!res.Body) throw new Error(`[s3] empty body for ${key}`);
  return streamToBuffer(res.Body as Readable);
}

export async function putObject(
  key: string,
  body: Buffer | string,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: MAIL_ENV.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: MAIL_ENV.S3_BUCKET, Key: key }));
}

/** Signed URL for client download of an attachment (default 15 min). */
export async function signedAttachmentUrl(key: string, expiresInSec = 900): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: MAIL_ENV.S3_BUCKET, Key: key }),
    { expiresIn: expiresInSec },
  );
}

export function attachmentKey(emailId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  return `${MAIL_ENV.S3_ATTACHMENT_PREFIX}${emailId}/${Date.now()}-${safe}`;
}
