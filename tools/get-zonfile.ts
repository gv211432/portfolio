import { $ } from "bun";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const DOMAIN = "gaurav.one";
const DIR_PATH = join(import.meta.dir, "..", "zonfiles");

// DNS servers to query for maximum record coverage
const DNS_SERVERS: Record<string, string> = {
  "Google Primary": "8.8.8.8",
  "Google Secondary": "8.8.4.4",
  "Cloudflare Primary": "1.1.1.1",
  "Cloudflare Secondary": "1.0.0.1",
  "Quad9": "9.9.9.9",
  "OpenDNS": "208.67.222.222",
  "Verisign": "64.6.64.6",
};

// All record types to query
const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "SRV",
  "CAA",
  "PTR",
  "DNSKEY",
  "DS",
  "NAPTR",
  "SPF",
  "LOC",
  "TLSA",
  "HINFO",
  "RP",
];

// Known subdomains to check (common ones + your project's subdomains)
const SUBDOMAINS = [
  "@", // root
  "www",
  "me",
  "opensource",
  "vision",
  "casestudy",
  "whitelabel",
  "blogs",
  "careers",
  "ngo",
  "github",
  "linkedin",
  "mail",
  "smtp",
  "imap",
  "pop",
  "pop3",
  "ftp",
  "webmail",
  "ns1",
  "ns2",
  "ns3",
  "ns4",
  "cpanel",
  "whm",
  "webdisk",
  "autodiscover",
  "autoconfig",
  "_dmarc",
  "_domainkey",
  "default._domainkey",
  "selector1._domainkey",
  "selector2._domainkey",
  "api",
  "cdn",
  "dev",
  "staging",
  "app",
  "admin",
  "panel",
  "dashboard",
  "shop",
  "store",
  "docs",
  "status",
  "test",
];

interface DnsRecord {
  name: string;
  ttl: number;
  class: string;
  type: string;
  value: string;
}

/**
 * Run dig command and parse the ANSWER SECTION
 */
async function digQuery(
  name: string,
  type: string,
  server: string
): Promise<DnsRecord[]> {
  try {
    const result =
      await $`dig @${server} ${name} ${type} +noall +answer +ttlid +time=5 +tries=1`
        .text()
        .catch(() => "");

    if (!result.trim()) return [];

    const records: DnsRecord[] = [];
    for (const line of result.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(";")) continue;

      // dig output: name ttl class type value...
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        records.push({
          name: parts[0],
          ttl: parseInt(parts[1], 10),
          class: parts[2],
          type: parts[3],
          value: parts.slice(4).join(" "),
        });
      }
    }
    return records;
  } catch {
    return [];
  }
}

/**
 * Discover authoritative nameservers for the domain
 */
async function getAuthoritativeNS(domain: string): Promise<string[]> {
  const records = await digQuery(domain, "NS", "8.8.8.8");
  const nameservers: string[] = [];
  for (const r of records) {
    // Resolve NS hostname to IP
    const aRecords = await digQuery(r.value, "A", "8.8.8.8");
    for (const a of aRecords) {
      nameservers.push(a.value);
    }
  }
  return nameservers;
}

/**
 * Attempt AXFR zone transfer (usually denied, but worth trying)
 */
async function tryZoneTransfer(
  domain: string,
  nsIp: string
): Promise<string | null> {
  try {
    const result =
      await $`dig @${nsIp} ${domain} AXFR +time=5 +tries=1`.text();
    if (result.includes("Transfer failed") || result.includes("XFR size: 0")) {
      return null;
    }
    if (result.includes("ANSWER SECTION") || result.includes("XFR size:")) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Deduplicate records by (name, type, value)
 */
function deduplicateRecords(records: DnsRecord[]): DnsRecord[] {
  const seen = new Set<string>();
  const unique: DnsRecord[] = [];
  for (const r of records) {
    const key = `${r.name}|${r.type}|${r.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
}

/**
 * Format records into BIND zone file format
 */
function formatZoneFile(domain: string, records: DnsRecord[]): string {
  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  lines.push(`; Zone file for ${domain}`);
  lines.push(`; Generated on ${timestamp}`);
  lines.push(`; Extracted from multiple DNS servers for migration to Route53`);
  lines.push(`;`);
  lines.push(`; WARNING: This is a best-effort extraction. AXFR was likely denied,`);
  lines.push(`; so records were gathered by querying known subdomains and record types.`);
  lines.push(`; Review carefully before importing into Route53.`);
  lines.push(`;`);
  lines.push(`$ORIGIN ${domain}.`);
  lines.push(``);

  // Group by type for readability
  const byType = new Map<string, DnsRecord[]>();
  for (const r of records) {
    const group = byType.get(r.type) || [];
    group.push(r);
    byType.set(r.type, group);
  }

  // SOA first, then NS, then the rest
  const typeOrder = ["SOA", "NS", "A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA", "DS", "DNSKEY"];
  const sortedTypes = [
    ...typeOrder.filter((t) => byType.has(t)),
    ...Array.from(byType.keys()).filter((t) => !typeOrder.includes(t)),
  ];

  for (const type of sortedTypes) {
    const group = byType.get(type)!;
    lines.push(`; --- ${type} Records ---`);
    for (const r of group) {
      // Make name relative to the domain
      let name = r.name;
      const fqdnSuffix = `.${domain}.`;
      if (name === `${domain}.`) {
        name = "@";
      } else if (name.endsWith(fqdnSuffix)) {
        name = name.slice(0, -fqdnSuffix.length);
      }

      const padName = name.padEnd(30);
      const padTtl = String(r.ttl).padEnd(8);
      lines.push(`${padName} ${padTtl} ${r.class}  ${r.type.padEnd(8)} ${r.value}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 DNS Zone File Extractor for: ${DOMAIN}\n`);

  // Step 1: Discover authoritative nameservers
  console.log("📡 Discovering authoritative nameservers...");
  const authNS = await getAuthoritativeNS(DOMAIN);
  console.log(`   Found ${authNS.length} authoritative NS IPs: ${authNS.join(", ")}`);

  // Add authoritative NS to the server list
  const allServers = { ...DNS_SERVERS };
  authNS.forEach((ip, i) => {
    allServers[`Authoritative NS ${i + 1}`] = ip;
  });

  // Step 2: Try AXFR zone transfer from each authoritative NS
  console.log("\n🔄 Attempting AXFR zone transfer...");
  let axfrResult: string | null = null;
  for (const ip of authNS) {
    console.log(`   Trying AXFR from ${ip}...`);
    axfrResult = await tryZoneTransfer(DOMAIN, ip);
    if (axfrResult) {
      console.log(`   ✅ AXFR succeeded from ${ip}!`);
      break;
    }
    console.log(`   ❌ AXFR denied/failed from ${ip}`);
  }

  if (axfrResult) {
    // If AXFR worked, save it directly
    mkdirSync(DIR_PATH, { recursive: true });
    const outPath = join(DIR_PATH, `${DOMAIN}-axfr-${Date.now()}.zone`);
    writeFileSync(outPath, axfrResult);
    console.log(`\n✅ AXFR zone file saved to: ${outPath}`);
    return;
  }

  // Step 3: Brute-force query all subdomains × record types × DNS servers
  console.log("\n🔎 AXFR unavailable. Querying records from multiple DNS servers...\n");

  const allRecords: DnsRecord[] = [];
  const serverEntries = Object.entries(allServers);
  let completed = 0;
  const totalQueries = SUBDOMAINS.length * RECORD_TYPES.length * serverEntries.length;

  // Process in batches to avoid overwhelming the system
  const BATCH_SIZE = 50;
  const queries: { name: string; type: string; server: string; serverLabel: string }[] = [];

  for (const sub of SUBDOMAINS) {
    const queryName = sub === "@" ? DOMAIN : `${sub}.${DOMAIN}`;
    for (const type of RECORD_TYPES) {
      for (const [label, ip] of serverEntries) {
        queries.push({ name: queryName, type, server: ip, serverLabel: label });
      }
    }
  }

  console.log(`   Total queries: ${totalQueries} (${SUBDOMAINS.length} names × ${RECORD_TYPES.length} types × ${serverEntries.length} servers)`);
  console.log(`   Running in batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((q) => digQuery(q.name, q.type, q.server))
    );
    for (const recs of results) {
      allRecords.push(...recs);
    }
    completed += batch.length;
    const pct = ((completed / totalQueries) * 100).toFixed(1);
    process.stdout.write(`\r   Progress: ${completed}/${totalQueries} (${pct}%)`);
  }

  console.log("\n");

  // Step 4: Deduplicate
  const unique = deduplicateRecords(allRecords);
  console.log(`📊 Found ${unique.length} unique records (from ${allRecords.length} total responses)`);

  // Show summary by type
  const typeCounts = new Map<string, number>();
  for (const r of unique) {
    typeCounts.set(r.type, (typeCounts.get(r.type) || 0) + 1);
  }
  console.log("\n   Record type breakdown:");
  for (const [type, count] of Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${type.padEnd(8)} ${count}`);
  }

  // Step 5: Write zone file
  mkdirSync(DIR_PATH, { recursive: true });

  const zoneContent = formatZoneFile(DOMAIN, unique);
  const zoneFilePath = join(DIR_PATH, `${DOMAIN}-${Date.now()}.zone`);
  writeFileSync(zoneFilePath, zoneContent);
  console.log(`\n✅ Zone file saved to: ${zoneFilePath}`);

  // Also save raw JSON for reference
  const jsonPath = join(DIR_PATH, `${DOMAIN}-${Date.now()}.json`);
  writeFileSync(jsonPath, JSON.stringify(unique, null, 2));
  console.log(`📋 Raw JSON saved to: ${jsonPath}`);

  // Step 6: Route53 import notes
  console.log(`
┌─────────────────────────────────────────────────────────┐
│  Route53 Migration Notes                                │
├─────────────────────────────────────────────────────────┤
│  1. Create a hosted zone for ${DOMAIN} in Route53       │
│  2. Update NS records at BigRock to point to Route53 NS │
│  3. Import the zone file or manually create records     │
│  4. Lower TTLs before migration, restore after          │
│  5. Verify with: dig @<route53-ns> ${DOMAIN} ANY        │
│  6. SOA & NS records will be auto-created by Route53    │
│  7. Remove BigRock NS records only after DNS propagates │
└─────────────────────────────────────────────────────────┘
  `);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
