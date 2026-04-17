/**
 * GET /api/mail/contacts?q=...&limit=10
 *
 * Returns two kinds of contacts:
 * 1. "directory" — all StaffEmailAddress entries (system users)
 * 2. "history" — distinct fromEmail addresses from this user's received emails
 *
 * Both are filtered by the query string and merged, directory first.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";

interface Contact { email: string; name?: string; source: "directory" | "history" }

export async function GET(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(20, Math.max(1, parseInt(sp.get("limit") ?? "10")));

  if (!q) return NextResponse.json({ contacts: [] });

  const contacts: Contact[] = [];

  // 1. Directory — all staff email addresses
  const staffAddrs = await prisma.staffEmailAddress.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { staff: { firstName: { contains: q, mode: "insensitive" } } },
        { staff: { lastName: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { staff: { select: { firstName: true, lastName: true, displayName: true } } },
    take: limit,
  });

  for (const sa of staffAddrs) {
    contacts.push({
      email: sa.email,
      name: sa.staff.displayName || `${sa.staff.firstName} ${sa.staff.lastName}`,
      source: "directory",
    });
  }

  // 2. History — distinct senders from this user's received emails
  const historyRows = await prisma.email.findMany({
    where: {
      staffId: actor.staffId,
      direction: "INBOUND",
      OR: [
        { fromEmail: { contains: q, mode: "insensitive" } },
        { fromName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { fromEmail: true, fromName: true },
    distinct: ["fromEmail"],
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const seen = new Set(contacts.map((c) => c.email));
  for (const h of historyRows) {
    if (seen.has(h.fromEmail)) continue;
    seen.add(h.fromEmail);
    contacts.push({
      email: h.fromEmail,
      name: h.fromName ?? undefined,
      source: "history",
    });
  }

  return NextResponse.json({ contacts: contacts.slice(0, limit) });
}
