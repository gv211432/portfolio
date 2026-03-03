import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { evaluate as mathEvaluate } from "mathjs";
import Fuse from "fuse.js";
import prisma from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";
import { caseStudies } from "@/data/caseStudiesData";

// ─── 1. get_datetime ────────────────────────────────────────────────────────

export const getDatetimeTool = tool(
  async ({ timezone }) => {
    const tz = timezone || "UTC";
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return JSON.stringify({
        iso: now.toISOString(),
        unix_ms: now.getTime(),
        formatted: formatter.format(now),
        timezone: tz,
        utc_offset: new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" })
          .formatToParts(now)
          .find((p) => p.type === "timeZoneName")?.value || "UTC",
      });
    } catch {
      return JSON.stringify({ iso: new Date().toISOString(), unix_ms: Date.now(), timezone: "UTC" });
    }
  },
  {
    name: "get_datetime",
    description: "Returns the current date, time, timezone, and Unix timestamp. Optionally accepts a timezone string like 'Asia/Kolkata'.",
    schema: z.object({
      timezone: z.string().optional().describe("IANA timezone string e.g. 'America/New_York'. Defaults to UTC."),
    }),
  }
);

// ─── 2. read_portfolio_file ──────────────────────────────────────────────────

const ALLOWED_READ_DIRS = [
  path.resolve(process.cwd(), "src/data"),
  path.resolve(process.cwd(), "public"),   // includes sitemap.xml, robots.txt, public/img/**
];

function isAllowedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return ALLOWED_READ_DIRS.some((dir) => resolved.startsWith(dir + path.sep) || resolved === dir);
}

export const readPortfolioFileTool = tool(
  async ({ file_path }) => {
    const fullPath = path.resolve(process.cwd(), file_path);
    if (!isAllowedPath(fullPath)) {
      return `Error: Access denied. Only files under src/data/ and public/ can be read.`;
    }
    try {
      if (!fs.existsSync(fullPath)) return `Error: File not found: ${file_path}`;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const entries = fs.readdirSync(fullPath);
        return `Directory listing for ${file_path}:\n${entries.join("\n")}`;
      }
      const content = fs.readFileSync(fullPath, "utf-8");
      // Truncate to 8k chars to avoid context overload
      return content.length > 8000 ? content.slice(0, 8000) + "\n\n[...truncated]" : content;
    } catch (err) {
      return `Error reading file: ${(err as Error).message}`;
    }
  },
  {
    name: "read_portfolio_file",
    description: "Read a file from the portfolio's data or public directories. Allowed paths: src/data/** and public/**. Use 'public/sitemap.xml' to discover all available pages on the site, then fetch_url to read their live content. Use src/data/ files for raw project/service/job data.",
    schema: z.object({
      file_path: z.string().describe("Relative path from project root, e.g. 'src/data/caseStudiesData.ts' or 'public/img/'"),
    }),
  }
);

// ─── 3. fuzzy_search_portfolio ───────────────────────────────────────────────

const PORTFOLIO_SEARCH_DATA = [
  ...caseStudies.map((cs) => ({
    type: "case_study",
    id: cs.slug,
    title: cs.title,
    description: cs.description,
    tags: [...cs.snapshot.techStack, cs.industry, cs.snapshot.industry],
    result: `Case Study: ${cs.title}\nTagline: ${cs.tagline}\nIndustry: ${cs.snapshot.industry}\nTech: ${cs.snapshot.techStack.join(", ")}\nKey Result: ${cs.snapshot.keyResult} ${cs.snapshot.keyResultLabel}\nDescription: ${cs.description}`,
  })),
  {
    type: "service",
    id: "defi",
    title: "DeFi Development",
    description: "DEX aggregators, liquidity pools, yield farming, staking platforms",
    tags: ["defi", "dex", "yield", "liquidity", "uniswap", "solana", "ethereum"],
    result: "Service: DeFi Development\nDEX aggregators, liquidity pools, yield farming, staking platforms on Solana, Ethereum, Sui.",
  },
  {
    type: "service",
    id: "trading",
    title: "Trading Platforms",
    description: "Crypto trading bots, signal systems, copy trading, futures platforms",
    tags: ["trading", "bot", "signals", "futures", "copy trading", "telegram"],
    result: "Service: Trading Platforms\nCrypto trading bots, signal systems, copy trading, futures platforms.",
  },
  {
    type: "service",
    id: "crosschain",
    title: "Cross-Chain Solutions",
    description: "Bridges, multi-chain protocols, chain abstraction",
    tags: ["bridge", "cross-chain", "multichain", "wormhole", "layerzero"],
    result: "Service: Cross-Chain Solutions\nBridges, multi-chain protocols, chain abstraction.",
  },
  {
    type: "service",
    id: "smartcontracts",
    title: "Smart Contracts",
    description: "Solidity, Rust (Solana), Move (Sui)",
    tags: ["smart contract", "solidity", "rust", "move", "sui", "solana", "ethereum"],
    result: "Service: Smart Contracts\nSolidity, Rust (Solana), Move (Sui) development.",
  },
  {
    type: "service",
    id: "whitelabel",
    title: "White-label Products",
    description: "Ready-to-deploy trading bots, DeFi platforms, social tools",
    tags: ["whitelabel", "white label", "ready-made", "saas", "deploy"],
    result: "Service: White-label Products\nReady-to-deploy trading bots, DeFi platforms, social tools.",
  },
];

const fuse = new Fuse(PORTFOLIO_SEARCH_DATA, {
  keys: ["title", "description", "tags", "type"],
  threshold: 0.4,
  includeScore: true,
});

export const fuzzySearchPortfolioTool = tool(
  async ({ query, limit }) => {
    const results = fuse.search(query, { limit: limit || 3 });
    if (results.length === 0) return "No matching portfolio items found.";
    return results.map((r, i) => `[${i + 1}] Score: ${r.score?.toFixed(2)}\n${r.item.result}`).join("\n\n---\n\n");
  },
  {
    name: "fuzzy_search_portfolio",
    description: "Fuzzy-search Gaurav's portfolio for case studies and services. Use when visitor asks about specific technologies, project types, or past work.",
    schema: z.object({
      query: z.string().describe("Search query, e.g. 'Solana DEX' or 'trading bot telegram'"),
      limit: z.number().int().min(1).max(5).optional().describe("Max results to return (1-5, default 3)"),
    }),
  }
);

// ─── 4. capture_lead ─────────────────────────────────────────────────────────

export const captureLeadTool = tool(
  async ({ name, email, telegram_handle, project_brief, budget, ip_address, session_id }) => {
    try {
      const lead = await prisma.chatLead.create({
        data: {
          sessionId: session_id,
          name: name || null,
          email: email || null,
          telegramHandle: telegram_handle || null,
          projectBrief: project_brief || null,
          budget: budget || null,
          ipAddress: ip_address || null,
          notified: false,
        },
      });

      // Build Telegram notification message
      const lines = [
        "🔔 <b>New Chat Lead!</b>",
        `📅 ${new Date().toISOString()}`,
        name ? `👤 Name: ${name}` : null,
        email ? `📧 Email: ${email}` : null,
        telegram_handle ? `💬 Telegram: @${telegram_handle}` : null,
        budget ? `💰 Budget: ${budget}` : null,
        ip_address ? `🌐 IP: ${ip_address}` : null,
        project_brief ? `\n📝 Brief:\n${project_brief.slice(0, 500)}` : null,
        `\n🆔 Lead ID: ${lead.id}`,
      ].filter(Boolean).join("\n");

      await sendTelegramNotification(lines);

      await prisma.chatLead.update({ where: { id: lead.id }, data: { notified: true } });

      return `Lead captured successfully (ID: ${lead.id}). Gaurav has been notified via Telegram and will follow up shortly.`;
    } catch (err) {
      console.error("[capture_lead] Error:", err);
      return `Failed to capture lead: ${(err as Error).message}`;
    }
  },
  {
    name: "capture_lead",
    description: "Save a visitor's contact details as a lead and notify Gaurav via Telegram. Call this when the visitor expresses interest in a project or wants to get in touch. At least one of email or telegram_handle is required.",
    schema: z.object({
      name: z.string().optional().describe("Visitor's name"),
      email: z.string().optional().describe("Visitor's email address"),
      telegram_handle: z.string().optional().describe("Visitor's Telegram handle (without @)"),
      project_brief: z.string().optional().describe("Short description of what they want to build"),
      budget: z.string().optional().describe("Stated budget or range e.g. '$5k–$20k'"),
      ip_address: z.string().optional().describe("Visitor IP address (from visitor context)"),
      session_id: z.string().optional().describe("Chat session identifier"),
    }),
  }
);

// ─── 5. fetch_url ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const fetchUrlTool = tool(
  async ({ url }) => {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioBot/1.0)" },
      });
      if (!res.ok) return `Error: HTTP ${res.status} from ${url}`;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text")) return `Error: Non-text response (${contentType})`;
      const html = await res.text();
      const text = stripHtml(html);
      return text.length > 6000 ? text.slice(0, 6000) + "\n\n[...truncated at 6000 chars]" : text;
    } catch (err) {
      return `Error fetching URL: ${(err as Error).message}`;
    }
  },
  {
    name: "fetch_url",
    description: "Fetch and read the text content of a web page. Returns plain text with HTML stripped. Use for looking up documentation, competitor sites, or any URL the visitor shares.",
    schema: z.object({
      url: z.url().describe("Full URL to fetch, e.g. 'https://example.com/docs'"),
    }),
  }
);

// ─── 6. crypto_price ──────────────────────────────────────────────────────────

export const cryptoPriceTool = tool(
  async ({ coins, vs_currency }) => {
    const ids = coins.join(",").toLowerCase();
    const currency = (vs_currency || "usd").toLowerCase();
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return `Error: CoinGecko API returned ${res.status}`;
      const data: Record<string, Record<string, number>> = await res.json();
      if (Object.keys(data).length === 0) return `No price data found for: ${ids}. Check the coin ID (use CoinGecko IDs like 'solana', 'bitcoin', 'ethereum').`;
      const lines = Object.entries(data).map(([coin, prices]) => {
        const price = prices[currency];
        const change = prices[`${currency}_24h_change`];
        const mcap = prices[`${currency}_market_cap`];
        return [
          `${coin.toUpperCase()}:`,
          `  Price: ${price?.toFixed(4)} ${currency.toUpperCase()}`,
          change !== undefined ? `  24h Change: ${change >= 0 ? "+" : ""}${change?.toFixed(2)}%` : null,
          mcap ? `  Market Cap: $${(mcap / 1e9).toFixed(2)}B` : null,
        ].filter(Boolean).join("\n");
      });
      return lines.join("\n\n");
    } catch (err) {
      return `Error fetching prices: ${(err as Error).message}`;
    }
  },
  {
    name: "crypto_price",
    description: "Get live cryptocurrency prices from CoinGecko. Use CoinGecko coin IDs (e.g. 'solana', 'bitcoin', 'ethereum', 'sui').",
    schema: z.object({
      coins: z.array(z.string()).min(1).max(5).describe("Array of CoinGecko coin IDs e.g. ['solana', 'ethereum']"),
      vs_currency: z.string().optional().describe("Quote currency e.g. 'usd', 'eur'. Defaults to 'usd'"),
    }),
  }
);

// ─── 7. calculate ─────────────────────────────────────────────────────────────

export const calculateTool = tool(
  async ({ expression }) => {
    try {
      const result = mathEvaluate(expression);
      return `Result: ${result}`;
    } catch (err) {
      return `Math error: ${(err as Error).message}`;
    }
  },
  {
    name: "calculate",
    description: "Evaluate a mathematical expression safely. Supports arithmetic, percentages, exponents, sqrt, log, etc. Use for ROI calculations, APY, gas costs, or any numeric computation.",
    schema: z.object({
      expression: z.string().describe("Math expression e.g. '((140000 * 12) / 5000) * 100' or 'sqrt(144) + 2^8'"),
    }),
  }
);

// ─── 8. wallet_validator ──────────────────────────────────────────────────────

const WALLET_PATTERNS: Record<string, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  sui: /^0x[a-fA-F0-9]{64}$/,
  bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
};

export const walletValidatorTool = tool(
  async ({ address, chain }) => {
    if (chain) {
      const pattern = WALLET_PATTERNS[chain.toLowerCase()];
      if (!pattern) return `Unknown chain: ${chain}. Supported: ${Object.keys(WALLET_PATTERNS).join(", ")}`;
      return pattern.test(address)
        ? `✅ Valid ${chain} address format`
        : `❌ Invalid ${chain} address format`;
    }
    // Auto-detect
    const matches = Object.entries(WALLET_PATTERNS)
      .filter(([, pat]) => pat.test(address))
      .map(([name]) => name);
    return matches.length > 0
      ? `✅ Valid address format for: ${matches.join(", ")}`
      : `❌ Does not match any known wallet format (checked: ${Object.keys(WALLET_PATTERNS).join(", ")})`;
  },
  {
    name: "wallet_validator",
    description: "Validate a cryptocurrency wallet address format for ETH, Solana, Sui, or Bitcoin. Detects chain automatically if not specified.",
    schema: z.object({
      address: z.string().describe("The wallet address to validate"),
      chain: z.string().optional().describe("Optional: 'ethereum', 'solana', 'sui', or 'bitcoin'"),
    }),
  }
);

// ─── 9. text_metrics ──────────────────────────────────────────────────────────

export const textMetricsTool = tool(
  async ({ text }) => {
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const lines = text.split("\n").length;
    const estimatedTokens = Math.ceil(chars / 4);
    return JSON.stringify({ chars, words, lines, estimated_tokens: estimatedTokens });
  },
  {
    name: "text_metrics",
    description: "Count characters, words, lines, and estimate token count for a given text. Useful for assessing context size before loading content.",
    schema: z.object({
      text: z.string().describe("The text to measure"),
    }),
  }
);

// ─── 10. regex_match ─────────────────────────────────────────────────────────

export const regexMatchTool = tool(
  async ({ text, pattern, flags, operation }) => {
    try {
      const regex = new RegExp(pattern, flags || "g");
      switch (operation) {
        case "test":
          return (new RegExp(pattern, flags || "")).test(text) ? "true" : "false";
        case "find_all": {
          const matches = Array.from(text.matchAll(new RegExp(pattern, (flags || "") + "g")));
          if (matches.length === 0) return "No matches found.";
          return matches.map((m, i) => `[${i}] "${m[0]}" at index ${m.index}`).join("\n");
        }
        case "replace": {
          return text.replace(regex, "");
        }
        default:
          return "Unknown operation. Use 'test', 'find_all', or 'replace'.";
      }
    } catch (err) {
      return `Regex error: ${(err as Error).message}`;
    }
  },
  {
    name: "regex_match",
    description: "Apply a regular expression to text. Supports test (boolean), find_all (list all matches), or replace (remove matches).",
    schema: z.object({
      text: z.string().describe("Input text to search in"),
      pattern: z.string().describe("Regex pattern string e.g. '\\\\d+' or '[a-z]+'"),
      flags: z.string().optional().describe("Regex flags e.g. 'i' for case-insensitive. 'g' is applied automatically for find_all/replace."),
      operation: z.enum(["test", "find_all", "replace"]).describe("Operation: 'test' returns true/false, 'find_all' lists all matches, 'replace' removes all matches"),
    }),
  }
);

// ─── 11. encode_decode ───────────────────────────────────────────────────────

export const encodeDecodeTool = tool(
  async ({ input, format, direction }) => {
    try {
      switch (format) {
        case "base64":
          return direction === "encode"
            ? Buffer.from(input, "utf-8").toString("base64")
            : Buffer.from(input, "base64").toString("utf-8");
        case "hex":
          return direction === "encode"
            ? Buffer.from(input, "utf-8").toString("hex")
            : Buffer.from(input, "hex").toString("utf-8");
        case "url":
          return direction === "encode"
            ? encodeURIComponent(input)
            : decodeURIComponent(input);
        default:
          return `Unknown format: ${format}. Use 'base64', 'hex', or 'url'.`;
      }
    } catch (err) {
      return `Encoding error: ${(err as Error).message}`;
    }
  },
  {
    name: "encode_decode",
    description: "Encode or decode strings in base64, hex, or URL encoding. Common in blockchain and Web3 workflows.",
    schema: z.object({
      input: z.string().describe("The string to encode or decode"),
      format: z.enum(["base64", "hex", "url"]).describe("Encoding format"),
      direction: z.enum(["encode", "decode"]).describe("'encode' or 'decode'"),
    }),
  }
);

// ─── 12. kv_get ──────────────────────────────────────────────────────────────

export const kvGetTool = tool(
  async ({ key }) => {
    try {
      const record = await prisma.chatKVStore.findUnique({ where: { key } });
      if (!record) return `Key "${key}" not found in store.`;
      return `${key} = ${record.value}`;
    } catch (err) {
      return `KV get error: ${(err as Error).message}`;
    }
  },
  {
    name: "kv_get",
    description: "Read a persistent key-value entry from the chat store. Use to recall remembered facts across turns.",
    schema: z.object({
      key: z.string().describe("The key to look up"),
    }),
  }
);

// ─── 13. kv_set ──────────────────────────────────────────────────────────────

export const kvSetTool = tool(
  async ({ key, value }) => {
    try {
      await prisma.chatKVStore.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      return `Stored: ${key} = ${value}`;
    } catch (err) {
      return `KV set error: ${(err as Error).message}`;
    }
  },
  {
    name: "kv_set",
    description: "Write or update a persistent key-value entry in the chat store. Use to remember important visitor context (budget, preferred chain, etc.).",
    schema: z.object({
      key: z.string().describe("The key (use descriptive names like 'visitor_budget' or 'preferred_chain')"),
      value: z.string().describe("The value to store (any text)"),
    }),
  }
);

// ─── 14. get_visitor_context ─────────────────────────────────────────────────
// This tool exposes the visitor context that was pre-injected into graph state.

export const getVisitorContextTool = tool(
  async ({ _injected_context }) => {
    return _injected_context || "Visitor context not available.";
  },
  {
    name: "get_visitor_context",
    description: "Returns the current visitor's geographic location, device info, browser, and IP. This info is pre-loaded from request headers.",
    schema: z.object({
      _injected_context: z.string().optional().describe("Internal: pre-injected visitor context string"),
    }),
  }
);

// ─── Export all tools ────────────────────────────────────────────────────────

export const ALL_TOOLS = [
  getDatetimeTool,
  readPortfolioFileTool,
  fuzzySearchPortfolioTool,
  captureLeadTool,
  fetchUrlTool,
  cryptoPriceTool,
  calculateTool,
  walletValidatorTool,
  textMetricsTool,
  regexMatchTool,
  encodeDecodeTool,
  kvGetTool,
  kvSetTool,
  getVisitorContextTool,
];
