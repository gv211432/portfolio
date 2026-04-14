/**
 * Threading — associates an inserted Email with an EmailThread.
 *
 * Strategy:
 *   1. If the new mail references any Message-ID that already belongs to a
 *      thread within this staff's mailbox, join that thread.
 *   2. Otherwise look for a thread with the same normalised subject within
 *      this staff's mailbox.
 *   3. Otherwise create a new thread.
 *
 * Thread lookup is scoped per-staffId because a mailbox is per-owner.
 */

import prisma from "@/lib/prisma";
import { normalizeSubject } from "./text";

export async function assignThread(args: {
  staffId: string;
  subject: string | null | undefined;
  messageId: string;
  inReplyTo?: string | null;
  references?: string[] | null;
  createdAt: Date;
}): Promise<string> {
  const subjectKey = normalizeSubject(args.subject);

  // 1. Lookup by referenced Message-IDs
  const refIds = Array.from(new Set([
    ...(args.references ?? []),
    ...(args.inReplyTo ? [args.inReplyTo] : []),
  ]));

  if (refIds.length > 0) {
    const priorEmail = await prisma.email.findFirst({
      where: { staffId: args.staffId, messageId: { in: refIds }, threadId: { not: null } },
      select: { threadId: true },
    });
    if (priorEmail?.threadId) {
      await prisma.emailThread.update({
        where: { id: priorEmail.threadId },
        data: { lastMessageAt: args.createdAt },
      });
      return priorEmail.threadId;
    }
  }

  // 2. Lookup by normalised subject (only if subject is non-empty)
  if (subjectKey) {
    const prior = await prisma.emailThread.findFirst({
      where: {
        subjectKey,
        emails: { some: { staffId: args.staffId } },
      },
      orderBy: { lastMessageAt: "desc" },
    });
    if (prior) {
      await prisma.emailThread.update({
        where: { id: prior.id },
        data: { lastMessageAt: args.createdAt },
      });
      return prior.id;
    }
  }

  // 3. Create new thread
  const created = await prisma.emailThread.create({
    data: {
      subjectKey,
      rootMessageId: args.messageId,
      lastMessageAt: args.createdAt,
    },
  });
  return created.id;
}
