/**
 * Text neutraliser — converts HTML/rich content into plain text for DB storage
 * and fuzzy search. Keeps only the human-readable content.
 *
 * Also: snippet generation, subject normalisation for threading, password
 * generator, and small utilities used across the mail stack.
 */

const HTML_BLOCK_TAGS = /<\/?(p|div|br|h[1-6]|li|tr|section|article|header|footer|table)[^>]*>/gi;

/** Convert HTML into neutralised plain text. Destroys all styling. */
export function htmlToText(html: string): string {
  if (!html) return "";
  return html
    // kill scripts + styles entirely (including content)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    // HTML comments
    .replace(/<!--[\s\S]*?-->/g, " ")
    // common block tags → newline
    .replace(HTML_BLOCK_TAGS, "\n")
    // all remaining tags → strip
    .replace(/<[^>]+>/g, " ")
    // entity decode (minimal)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    // collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function makeSnippet(text: string, len = 200): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= len ? flat : flat.slice(0, len - 1) + "…";
}

/** Normalize subject for threading ("Re: Re: FWD: Hi" → "hi"). */
export function normalizeSubject(subject: string | null | undefined): string {
  if (!subject) return "";
  let s = subject.trim().toLowerCase();
  // strip leading Re:/Fwd:/Fw: prefixes repeatedly
  while (true) {
    const next = s.replace(/^(re|fwd|fw)\s*:\s*/i, "").trim();
    if (next === s) break;
    s = next;
  }
  return s.replace(/\s+/g, " ");
}

/**
 * Friendly auto-generated password: 3 short words + 2 digits + 1 symbol.
 * Easy to read aloud, still ~40 bits of entropy.
 * Example: "Copper-Maple-Nest-47!"
 */
export function generateFriendlyPassword(): string {
  const words = [
    "Amber","Apple","Aqua","Beach","Berry","Birch","Bloom","Brave","Brick","Brook",
    "Cedar","Cliff","Cloud","Cobalt","Comet","Coral","Cove","Crane","Creek","Crest",
    "Daisy","Dawn","Delta","Dune","Ember","Fable","Falcon","Fern","Flint","Forest",
    "Frost","Galaxy","Glade","Glow","Grove","Harbor","Hazel","Hive","Indigo","Ivory",
    "Jade","Juno","Kite","Lark","Linen","Lotus","Lynx","Maple","Marble","Meadow",
    "Mint","Moss","Nest","Nova","Oak","Ocean","Onyx","Opal","Orchid","Otter",
    "Peak","Pine","Plum","Pond","Quartz","Quill","Raven","Reef","Ridge","River",
    "Rose","Sage","Saffron","Sand","Sable","Silver","Sky","Slate","Snow","Solar",
    "Spark","Stone","Storm","Sunny","Sycamore","Tide","Topaz","Trail","Tulip","Vale",
    "Velvet","Violet","Willow","Winter","Zephyr"
  ];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(10 + Math.random() * 90));
  const symbol = "!@#$%&*"[Math.floor(Math.random() * 7)];
  return `${pick()}-${pick()}-${pick()}-${digits}${symbol}`;
}

/** 6-digit numeric OTP. */
export function generateNumericOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Parse a comma/semicolon/newline separated address input from a UI form. */
export function parseAddressInput(raw: string): { email: string; name?: string }[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(?:"?([^"<]+?)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?$/);
      if (!m) return { email: s };
      const name = m[1]?.trim();
      return name ? { email: m[2].toLowerCase(), name } : { email: m[2].toLowerCase() };
    });
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
