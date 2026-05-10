/**
 * POST /api/admin/upload
 *
 * Accepts a multipart form-data file upload, stores it in S3 under
 * `uploads/staff/<timestamp>-<filename>`, and returns a signed URL.
 * Used for staff profile images.
 *
 * Security: uses magic-byte detection to verify actual file type;
 * does not trust the browser-supplied Content-Type. SVG is excluded
 * (no reliable magic bytes; can embed JS).
 */

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin/permissions";
import { putObject, signedAttachmentUrl } from "@/lib/mail/s3";
import { MAIL_ENV } from "@/lib/mail/env";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Detect real MIME type from the first bytes of the file.
// Returns null if the file doesn't match any known safe image format.
function detectMime(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
      buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return "image/png";
  // GIF: 47 49 46 38 (GIF8)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: RIFF at 0..3, WEBP at 8..11
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

// Map detected MIME to a safe file extension
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const perm = await requirePermission(req, "upload.staff_image");
  if (!perm.ok) return perm.response;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Detect type from magic bytes — ignore browser-supplied Content-Type
  const detectedMime = detectMime(buf);
  if (!detectedMime) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP" },
      { status: 400 }
    );
  }

  const ext     = MIME_EXT[detectedMime];
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 60);
  const key     = `uploads/staff/${Date.now()}-${safeName}.${ext}`;

  await putObject(key, buf, detectedMime);
  void MAIL_ENV; // ensure env is validated

  const url = await signedAttachmentUrl(key, 7 * 24 * 3600);
  return NextResponse.json({ key, url, contentType: detectedMime, sizeBytes: file.size });
}
