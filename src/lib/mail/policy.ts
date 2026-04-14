/**
 * Outbound policy engine.
 *
 * Resolution rule (user confirmed):
 *   Staff.allowedDomainsOverride takes FULL precedence when non-null.
 *   null  → fall back to GlobalPolicy.allowedDomains
 *   []    → explicit lockdown (block ALL outbound)
 *   [...] → only listed domains
 *
 * Any single violating recipient (To/Cc/Bcc) rejects the entire email.
 */

import prisma from "@/lib/prisma";

export interface PolicyEvaluation {
  allowed: boolean;
  allowedDomains: string[];
  source: "override" | "global";
  blockedRecipients: string[]; // addresses that violated policy
}

function domainOf(email: string): string {
  const idx = email.lastIndexOf("@");
  return idx === -1 ? "" : email.slice(idx + 1).toLowerCase().trim();
}

function normalizeDomains(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d): d is string => typeof d === "string")
    .map((d) => d.toLowerCase().trim())
    .filter(Boolean);
}

/** Fetch effective allowed-domain list for a staff. */
export async function getEffectivePolicy(staffId: string): Promise<{
  allowedDomains: string[];
  source: "override" | "global";
}> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { allowedDomainsOverride: true },
  });

  if (staff?.allowedDomainsOverride !== null && staff?.allowedDomainsOverride !== undefined) {
    return {
      allowedDomains: normalizeDomains(staff.allowedDomainsOverride),
      source: "override",
    };
  }

  const global = await prisma.globalPolicy.findUnique({ where: { id: "global" } });
  return {
    allowedDomains: normalizeDomains(global?.allowedDomains),
    source: "global",
  };
}

export async function evaluateOutboundPolicy(
  staffId: string,
  recipients: string[],
): Promise<PolicyEvaluation> {
  const { allowedDomains, source } = await getEffectivePolicy(staffId);
  const allowSet = new Set(allowedDomains);

  const blocked: string[] = [];
  for (const r of recipients) {
    const d = domainOf(r);
    if (!d || !allowSet.has(d)) blocked.push(r);
  }

  return {
    allowed: blocked.length === 0,
    allowedDomains,
    source,
    blockedRecipients: blocked,
  };
}
