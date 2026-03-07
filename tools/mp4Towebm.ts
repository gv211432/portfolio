/**
 * mp4Towebm.ts — Batch video optimizer for web distribution
 *
 * Converts MP4 (or any video) to WebM (VP9 + Opus) for minimal bandwidth,
 * fast lazy loading, and broad browser support. Also generates a poster image
 * for use with the HTML `poster` attribute.
 *
 * Output formats:
 *   - .webm  (VP9 + Opus)   — primary, ~40–70% smaller than source MP4
 *   - .mp4   (H.264 + AAC)  — fallback re-encode with faststart + stripped metadata
 *   - .jpg   (poster frame) — for lazy loading / above-the-fold placeholders
 *
 * Usage:
 *   bun tools/mp4Towebm.ts [input] [options]
 *
 * Examples:
 *   bun tools/mp4Towebm.ts public/videos/hero.mp4
 *   bun tools/mp4Towebm.ts public/videos/              # batch-convert entire dir
 *   bun tools/mp4Towebm.ts hero.mp4 --no-poster        # skip poster generation
 *   bun tools/mp4Towebm.ts hero.mp4 --no-mp4           # skip fallback MP4
 *   bun tools/mp4Towebm.ts hero.mp4 --crf 35           # lower quality, smaller file
 *   bun tools/mp4Towebm.ts hero.mp4 --out dist/videos  # custom output directory
 *
 * Quality guide (--crf):
 *   0  = lossless (huge)
 *   28 = default — visually near-lossless for most content
 *   35 = good quality, noticeably smaller
 *   40 = acceptable for background/decorative videos
 *   63 = worst quality (tiny)
 *
 * Requires: ffmpeg (brew install ffmpeg / apt install ffmpeg)
 */

import { $ } from "bun";
import fs from "fs";
import path from "path";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function flag(name: string): boolean {
  return args.includes(`--${name}`);
}

function option(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const inputArg = args.find((a) => !a.startsWith("--")) ?? ".";
const CRF = parseInt(option("crf", "28"), 10);
const POSTER_SECOND = parseFloat(option("poster-at", "1")); // which second to grab poster
const SKIP_POSTER = flag("no-poster");
const SKIP_MP4 = flag("no-mp4");
const CUSTOM_OUT = option("out", "");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileSizeOf(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function reduction(original: number, output: number): string {
  if (original === 0) return "N/A";
  const pct = ((original - output) / original) * 100;
  return pct > 0 ? `-${pct.toFixed(1)}%` : `+${Math.abs(pct).toFixed(1)}%`;
}

function resolveOutput(inputFile: string): string {
  if (CUSTOM_OUT) {
    fs.mkdirSync(CUSTOM_OUT, { recursive: true });
    return CUSTOM_OUT;
  }
  return path.dirname(inputFile);
}

// ─── Check ffmpeg ─────────────────────────────────────────────────────────────

async function checkFfmpeg(): Promise<void> {
  try {
    await $`ffmpeg -version`.quiet();
  } catch {
    console.error(
      "ERROR: ffmpeg not found.\n" +
        "  macOS:  brew install ffmpeg\n" +
        "  Ubuntu: sudo apt install ffmpeg\n" +
        "  Arch:   sudo pacman -S ffmpeg\n"
    );
    process.exit(1);
  }
}

// ─── Convert single file ──────────────────────────────────────────────────────

async function convertFile(inputFile: string): Promise<void> {
  const originalSize = fileSizeOf(inputFile);
  const outDir = resolveOutput(inputFile);
  const base = path.join(outDir, path.basename(inputFile, path.extname(inputFile)));

  console.log(`\nProcessing: ${inputFile}`);
  console.log(`  Source size : ${formatBytes(originalSize)}`);

  // ── 1. WebM (VP9 + Opus) ──────────────────────────────────────────────────
  const webmOut = `${base}.webm`;
  console.log(`  → WebM (VP9 + Opus, CRF ${CRF}) ...`);
  try {
    const webmResult = await $`ffmpeg -y -i ${inputFile} -c:v libvpx-vp9 -crf ${CRF} -b:v 0 -row-mt 1 -tile-columns 2 -c:a libopus -b:a 64k -vbr on -map_metadata -1 ${webmOut}`.quiet();
    void webmResult;
    const webmSize = fileSizeOf(webmOut);
    console.log(
      `     Saved: ${webmOut}\n` +
        `     Size : ${formatBytes(webmSize)} (${reduction(originalSize, webmSize)} vs source)`
    );
  } catch (e: unknown) {
    const err = e as { stderr?: Buffer | string; message?: string };
    console.error(`     FAILED: ${err.stderr?.toString().trim() || err.message}`);
  }

  // ── 2. Fallback MP4 (H.264/AAC, web-optimised) ───────────────────────────
  if (!SKIP_MP4) {
    const mp4Out = `${base}.web.mp4`;
    console.log(`  → Fallback MP4 (H.264 + AAC, faststart) ...`);
    try {
      const mp4Result = await $`ffmpeg -y -i ${inputFile} -c:v libx264 -crf ${CRF} -preset slow -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart -map_metadata -1 ${mp4Out}`.quiet();
      void mp4Result;
      const mp4Size = fileSizeOf(mp4Out);
      console.log(
        `     Saved: ${mp4Out}\n` +
          `     Size : ${formatBytes(mp4Size)} (${reduction(originalSize, mp4Size)} vs source)`
      );
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer | string; message?: string };
      console.error(`     FAILED: ${err.stderr?.toString().trim() || err.message}`);
    }
  }

  // ── 3. Poster frame (JPEG) ────────────────────────────────────────────────
  if (!SKIP_POSTER) {
    const posterOut = `${base}.poster.jpg`;
    console.log(`  → Poster frame at ${POSTER_SECOND}s ...`);
    try {
      const posterResult = await $`ffmpeg -y -ss ${POSTER_SECOND} -i ${inputFile} -frames:v 1 -q:v 5 ${posterOut}`.quiet();
      void posterResult;
      const posterSize = fileSizeOf(posterOut);
      console.log(
        `     Saved: ${posterOut}\n` +
          `     Size : ${formatBytes(posterSize)}`
      );
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer | string; message?: string };
      console.error(`     FAILED: ${err.stderr?.toString().trim() || err.message}`);
    }
  }
}

// ─── Discover input files ─────────────────────────────────────────────────────

async function resolveInputFiles(): Promise<string[]> {
  const target = path.resolve(inputArg);

  if (!fs.existsSync(target)) {
    console.error(`ERROR: path not found — ${target}`);
    process.exit(1);
  }

  const stat = fs.statSync(target);

  if (stat.isDirectory()) {
    const files = fs
      .readdirSync(target)
      .filter((f) => /\.(mp4|mov|avi|mkv|m4v|ts|flv|wmv)$/i.test(f))
      .map((f) => path.join(target, f));

    if (files.length === 0) {
      console.error(`No video files found in ${target}`);
      process.exit(1);
    }

    return files;
  }

  return [target];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await checkFfmpeg();

  const files = await resolveInputFiles();

  console.log(`\nVideo Optimizer`);
  console.log("=".repeat(50));
  console.log(`  Files       : ${files.length}`);
  console.log(`  CRF         : ${CRF}`);
  console.log(`  WebM        : yes (VP9 + Opus)`);
  console.log(`  MP4 fallback: ${SKIP_MP4 ? "no" : "yes (H.264 + AAC)"}`);
  console.log(`  Poster      : ${SKIP_POSTER ? "no" : `yes (frame at ${POSTER_SECOND}s)`}`);
  console.log("=".repeat(50));

  for (const file of files) {
    await convertFile(file);
  }

  console.log(`\nDone. ${files.length} file(s) processed.\n`);
  console.log("HTML usage example:");
  console.log(`  <video autoplay muted loop playsinline preload="none" poster="video.poster.jpg">`);
  console.log(`    <source src="video.webm" type="video/webm" />`);
  console.log(`    <source src="video.web.mp4" type="video/mp4" />`);
  console.log(`  </video>`);
}

main();
