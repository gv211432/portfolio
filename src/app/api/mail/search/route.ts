/**
 * GET /api/mail/search?q=...&limit=50&folder=...
 *
 * Fuzzy search over the staff's mailbox using pg_trgm similarity on
 * subject / bodyText / fromEmail. Ranked by max(similarity) descending,
 * tiebreak on recency.
 *
 * Falls back to ILIKE for very short queries (<3 chars).
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";

interface Hit {
  id: string;
  createdAt: Date;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  snippet: string;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  direction: string;
  threadId: string | null;
  score: number;
}

export async function GET(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50")));
  const folder = sp.get("folder"); // optional

  if (!q) return NextResponse.json({ emails: [] });

  if (q.length < 3) {
    // trigram needs ≥3 chars; fall back to simple ILIKE
    const rows = await prisma.email.findMany({
      where: {
        staffId: actor.staffId,
        ...(folder ? { folder: folder as "INBOX" | "SENT" | "TRASH" | "DRAFT" | "SPAM" } : {}),
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { fromEmail: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({
      emails: rows.map((e) => ({
        id: e.id, createdAt: e.createdAt, fromEmail: e.fromEmail, fromName: e.fromName,
        subject: e.subject, snippet: e.snippet, folder: e.folder, isRead: e.isRead,
        isStarred: e.isStarred, direction: e.direction, threadId: e.threadId, score: 1,
      })),
    });
  }

  // pg_trgm similarity; unnormalize case with LOWER.
  const folderFilter = folder ? `AND "folder" = $3::"EmailFolder"` : "";
  const params: unknown[] = [actor.staffId, q];
  if (folder) params.push(folder);
  params.push(limit);

  const rows = await prisma.$queryRawUnsafe<Hit[]>(
    `SELECT "id", "createdAt", "fromEmail", "fromName", "subject", "snippet",
            "folder"::text as "folder", "isRead", "isStarred", "direction"::text as "direction", "threadId",
            GREATEST(
              similarity(COALESCE("subject",''), $2),
              similarity("bodyText", $2),
              similarity("fromEmail", $2)
            ) as "score"
       FROM "Email"
      WHERE "staffId" = $1
        ${folderFilter}
        AND (
          "subject"  % $2 OR
          "bodyText" % $2 OR
          "fromEmail" % $2
        )
      ORDER BY "score" DESC, "createdAt" DESC
      LIMIT $${params.length}`,
    ...params,
  );

  return NextResponse.json({ emails: rows });
}
