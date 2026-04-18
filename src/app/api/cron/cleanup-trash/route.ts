/**
 * GET /api/cron/cleanup-trash
 *
 * Hard-deletes emails that have been in TRASH for more than 30 days.
 * Call with header  x-cron-secret: <CRON_SECRET>
 * or query param    ?secret=<CRON_SECRET>
 *
 * Processes up to 500 emails per run (safe for cron minute intervals).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteObject } from "@/lib/mail/s3";

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);

  const emails = await prisma.email.findMany({
    where: { folder: "TRASH", updatedAt: { lt: cutoff } },
    include: { attachments: true },
    take: 500,
  });

  let deleted = 0;
  for (const email of emails) {
    for (const a of email.attachments) {
      await deleteObject(a.s3Key).catch((e) => console.error("[cron/cleanup-trash] s3:", e));
    }
    await prisma.email.delete({ where: { id: email.id } }).catch(console.error);
    deleted++;
  }

  console.log(`[cron/cleanup-trash] deleted ${deleted} emails (cutoff: ${cutoff.toISOString()})`);
  return NextResponse.json({ ok: true, deleted, cutoff });
}
