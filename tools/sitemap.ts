/**
 * Sitemap generator — runs before every build via `bun tools/sitemap.ts`.
 * Writes public/sitemap.xml covering all static and dynamic routes across
 * the root domain and all subdomains.
 *
 * Domain structure (from middleware.ts):
 *   gaurav.one              → /  /contact  /privacy
 *   me.gaurav.one           → /
 *   casestudy.gaurav.one    → /  /case-studies/[slug]
 *   whitelabel.gaurav.one   → /  /products/[slug]
 *   careers.gaurav.one      → /  /jobs/[slug]
 *   opensource.gaurav.one   → /
 *   ngo.gaurav.one          → /
 *   blogs.gaurav.one        → /
 *   vision.gaurav.one       → /
 */

import fs from "fs";
import path from "path";
import { caseStudies } from "@/data/caseStudiesData";
import { whitelabelProducts } from "@/data/whitelabelProducts";
import { jobPositions } from "@/data/careersData";

// ─── Config ─────────────────────────────────────────────────────────────────

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "gaurav.one")
  .replace(/^https?:\/\//, "")
  .split(":")[0]
  .split(".")
  .slice(-2)
  .join(".");

const PROTOCOL = ROOT_DOMAIN.includes("localhost") ? "http" : "https";

function url(subdomain: string | null, pathname = "/"): string {
  const host = subdomain ? `${subdomain}.${ROOT_DOMAIN}` : ROOT_DOMAIN;
  return `${PROTOCOL}://${host}${pathname}`;
}

// ─── URL entry types ─────────────────────────────────────────────────────────

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
}

// ─── Build all entries ───────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const entries: SitemapEntry[] = [
  // ── Root domain ────────────────────────────────────────────────────────────
  { loc: url(null, "/"),        changefreq: "weekly",  priority: 1.0, lastmod: today },
  { loc: url(null, "/contact"), changefreq: "monthly", priority: 0.7, lastmod: today },
  { loc: url(null, "/privacy"), changefreq: "yearly",  priority: 0.3, lastmod: today },

  // ── Subdomain roots ────────────────────────────────────────────────────────
  { loc: url("me"),         changefreq: "monthly", priority: 0.8, lastmod: today },
  { loc: url("casestudy"),  changefreq: "monthly", priority: 0.9, lastmod: today },
  { loc: url("whitelabel"), changefreq: "monthly", priority: 0.9, lastmod: today },
  { loc: url("careers"),    changefreq: "weekly",  priority: 0.8, lastmod: today },
  { loc: url("opensource"), changefreq: "monthly", priority: 0.7, lastmod: today },
  { loc: url("ngo"),        changefreq: "monthly", priority: 0.6, lastmod: today },
  { loc: url("blogs"),      changefreq: "daily",   priority: 0.8, lastmod: today },
  { loc: url("vision"),     changefreq: "yearly",  priority: 0.5, lastmod: today },
  { loc: url("chat"),     changefreq: "yearly",  priority: 0.5, lastmod: today },

  // ── Case study detail pages ────────────────────────────────────────────────
  ...caseStudies.map((cs) => ({
    loc: url("casestudy", `/case-studies/${cs.slug}`),
    changefreq: "monthly" as ChangeFreq,
    priority: 0.85,
    lastmod: cs.completedAt ? `${cs.completedAt}-01-01` : today,
  })),

  // ── Whitelabel product detail pages ───────────────────────────────────────
  ...whitelabelProducts.map((p) => ({
    loc: url("whitelabel", `/products/${p.slug}`),
    changefreq: "monthly" as ChangeFreq,
    priority: 0.8,
    lastmod: today,
  })),

  // ── Job detail pages ───────────────────────────────────────────────────────
  ...jobPositions.map((job) => ({
    loc: url("careers", `/jobs/${job.slug}`),
    changefreq: "weekly" as ChangeFreq,
    priority: 0.75,
    lastmod: today,
  })),
];

// ─── Render XML ──────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderEntry(entry: SitemapEntry): string {
  const lines = [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`];
  if (entry.lastmod)   lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  lines.push(`  </url>`);
  return lines.join("\n");
}

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map(renderEntry),
  `</urlset>`,
  "", // trailing newline
].join("\n");

// ─── Write to public/sitemap.xml ─────────────────────────────────────────────

const outPath = path.resolve(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf-8");

console.log(`✅ sitemap.xml generated → ${outPath}`);
console.log(`   ${entries.length} URLs across ${ROOT_DOMAIN} and its subdomains`);
entries.forEach((e) => console.log(`   ${e.loc}`));
