/**
 * GET /api/mail/contacts?q=...&limit=10
 *
 * Returns two kinds of contacts:
 * 1. "directory" — all StaffEmailAddress entries with name + designation
 * 2. "history"   — distinct addresses from this user's email history (both inbound senders
 *                  and outbound recipients parsed from to/cc/bcc JSON fields)
 *
 * Both are filtered by the query string and merged, directory first.
 * Matching uses case-insensitive substring on email, name, and designation fields.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMailActor } from "@/lib/mail/mailActor";

interface Contact { email: string; name?: string; designation?: string; source: "directory" | "history" }

function scoreMatch(q: string, email: string, name?: string | null, designation?: string | null): number {
  const lq = q.toLowerCase();
  const le = email.toLowerCase();
  const ln = (name ?? "").toLowerCase();
  const ld = (designation ?? "").toLowerCase();
  if (le === lq || ln === lq) return 3;
  if (le.startsWith(lq) || ln.startsWith(lq)) return 2;
  if (le.includes(lq) || ln.includes(lq) || ld.includes(lq)) return 1;
  return 0;
}

export async function GET(req: NextRequest) {
  const r = await resolveMailActor(req);
  if (!r.ok) return r.response;
  const { actor } = r;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(20, Math.max(1, parseInt(sp.get("limit") ?? "10")));

  if (!q) return NextResponse.json({ contacts: [] });

  const contacts: Contact[] = [];

  // 1. Directory — all staff email addresses, parallel fetch with history
  const [staffAddrs, inboundRows, outboundRows] = await Promise.all([
    prisma.staffEmailAddress.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { staff: { firstName: { contains: q, mode: "insensitive" } } },
          { staff: { lastName: { contains: q, mode: "insensitive" } } },
          { staff: { displayName: { contains: q, mode: "insensitive" } } },
          { staff: { role: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        staff: { select: { firstName: true, lastName: true, displayName: true, role: true } },
      },
      take: limit,
    }),
    // Inbound senders
    prisma.email.findMany({
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
      take: limit * 3,
    }),
    // Outbound recent emails to extract recipients
    prisma.email.findMany({
      where: { staffId: actor.staffId, direction: "OUTBOUND" },
      select: { toJson: true, ccJson: true, bccJson: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  // Build directory contacts
  for (const sa of staffAddrs) {
    const name = sa.staff.displayName || `${sa.staff.firstName} ${sa.staff.lastName}`;
    contacts.push({
      email: sa.email,
      name,
      designation: sa.staff.role ?? undefined,
      source: "directory",
    });
  }

  // Build history set (deduplicated, scored)
  const seen = new Set(contacts.map((c) => c.email.toLowerCase()));
  const historyMap = new Map<string, { name?: string; score: number }>();

  // From inbound senders
  for (const h of inboundRows) {
    const key = h.fromEmail.toLowerCase();
    if (seen.has(key)) continue;
    const score = scoreMatch(q, h.fromEmail, h.fromName);
    if (score === 0) continue;
    const existing = historyMap.get(key);
    if (!existing || score > existing.score) {
      historyMap.set(key, { name: h.fromName ?? undefined, score });
    }
  }

  // From outbound recipients (to/cc/bcc JSON arrays)
  type AddrObj = { email?: string; name?: string };
  for (const e of outboundRows) {
    for (const field of [e.toJson, e.ccJson, e.bccJson]) {
      if (!Array.isArray(field)) continue;
      for (const addr of field as AddrObj[]) {
        if (!addr?.email) continue;
        const key = addr.email.toLowerCase();
        if (seen.has(key)) continue;
        const score = scoreMatch(q, addr.email, addr.name);
        if (score === 0) continue;
        const existing = historyMap.get(key);
        if (!existing || score > existing.score) {
          historyMap.set(key, { name: addr.name ?? undefined, score });
        }
      }
    }
  }

  // Sort history by score descending
  const historyEntries = Array.from(historyMap.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit);

  for (const [email, { name }] of historyEntries) {
    contacts.push({ email, name, source: "history" });
  }

  return NextResponse.json({ contacts: contacts.slice(0, limit) });
}
