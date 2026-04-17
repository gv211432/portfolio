/**
 * POST /api/mail/attachments/upload
 *
 * Accepts a single file upload (multipart form-data), stores it in S3 under
 * `attachments/outbound/<timestamp>-<filename>`, returns { key, url }.
 * Used by the Compose UI for outbound email attachments.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveMailActor } from "@/lib/mail/mailActor";
import { putObject, signedAttachmentUrl } from "@/lib/mail/s3";

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB (SES limit for raw messages)

export async function POST(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const key = `attachments/outbound/${Date.now()}-${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  await putObject(key, buf, file.type || "application/octet-stream");

  const url = await signedAttachmentUrl(key, 24 * 3600); // 24h

  return NextResponse.json({
    key,
    url,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });
}
