/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form-data file upload, stores it in S3 under
 * `uploads/staff/<timestamp>-<filename>`, and returns a signed URL.
 * Used for staff profile images.
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin/permissions";
import { putObject, signedAttachmentUrl } from "@/lib/mail/s3";
import { MAIL_ENV } from "@/lib/mail/env";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "upload.staff_image");
  if (!perm.ok) return perm.response;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG` }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const key = `uploads/staff/${Date.now()}-${safeName}`;

  const buf = Buffer.from(await file.arrayBuffer());
  await putObject(key, buf, file.type);

  // Return both the S3 key and a long-lived signed URL (7 days)
  const url = await signedAttachmentUrl(key, 7 * 24 * 3600);

  // Also return the permanent public-style path (if bucket is set up with CloudFront / public read)
  // For now, just use the S3 key that the app can re-sign later
  return NextResponse.json({ key, url, contentType: file.type, sizeBytes: file.size });
}
