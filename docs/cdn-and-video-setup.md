# CDN & Video Setup Reference

Date: 2026-04-18  
Author: Claude (session log)

---

## 1. Hero Video — HLS Conversion

### Problem
The hero video was loaded with a 3.5-second artificial delay (`setTimeout`) to avoid blocking the initial page load. The video format (MP4/WebM) downloads sequentially, so playback couldn't start until enough bytes were buffered.

### Solution
Converted the video to HLS (HTTP Live Streaming) with 2-second segments. HLS lets the browser start playing after downloading only the first segment (~186 KB) instead of waiting for the entire file.

### FFmpeg Command Used
```bash
ffmpeg -i public/videos/hero/video.web.mp4 \
  -c:v libx264 -preset fast -crf 28 \
  -an \
  -g 50 -keyint_min 50 -sc_threshold 0 \
  -hls_time 2 \
  -hls_playlist_type vod \
  -hls_segment_filename 'public/videos/hero/hls/seg%03d.ts' \
  -f hls public/videos/hero/hls/output.m3u8
```

**Key flags explained:**
- `-g 50 -keyint_min 50` — GOP size = 50 frames (video is 25 fps → 2s per segment). GPT suggested `-g 48` which is wrong for 25fps and causes misaligned keyframes.
- `-sc_threshold 0` — disables scene-change keyframe insertion, so segment boundaries are always exactly at 2s.
- `-an` — strips audio (background video, no sound needed, reduces file size).
- `-crf 28` — quality level (higher = smaller file, lower quality). 28 is fine for a background overlay.

**Output:** 19 segments × ~2s each, first segment = 186 KB (loads instantly).

### Output Files
```
public/videos/hero/hls/
├── output.m3u8      # playlist (entry point)
├── seg000.ts        # ~186 KB — first 2 seconds
├── seg001.ts
├── ...
└── seg018.ts        # last partial segment (0.12s)
```

### HeroVideo Component
**File:** `src/components/ui/HeroVideo.tsx`

- Uses `hls.js` (installed: `bun add hls.js`)
- Loads HLS immediately on mount (no artificial delay)
- Sets `playbackRate = 0.8` for slow-motion effect
- Falls back to native HLS for Safari (`video.canPlayType('application/vnd.apple.mpegurl')`)
- Falls back to plain MP4 if HLS unsupported at all

**Config values used:**
```ts
maxBufferLength: 4        // only buffer 4s ahead — starts fast
maxMaxBufferLength: 8
abrEwmaDefaultEstimate: 2_000_000  // assume 2Mbps bandwidth initially
```

### Changes to page.tsx
- Removed `videoRef`, `videoSrcReady` state, and the two `useEffect` hooks
- Replaced `<video>` block with `<HeroVideo className="..." />`
- Removed `useRef` import

---

## 2. Google Analytics / GTM — Exclusion Config

### Problem
GA and GTM scripts were hardcoded in `layout.tsx` with no way to exclude paths or subdomains.

### Solution
Extracted tracking to a central config + client-side provider.

### Files

**`src/config/analytics.ts`** — single source of truth:
```ts
const analyticsConfig = {
  GA_ID: "G-QLX1NFZ695",
  GTM_ID: "GTM-T3ZKK9HQ",
  EXCLUDED_PATHS: ["/admin"],
  EXCLUDED_SUBDOMAINS: ["webmail", "mail"],
}
```
To add more exclusions, edit this file only.

**`src/components/providers/AnalyticsProvider.tsx`** — client component:
- Reads `usePathname()` and `window.location.hostname`
- Returns `null` (renders no scripts) when path or subdomain is excluded
- Renders GA + GTM scripts otherwise

**`src/app/layout.tsx`** — now just:
```tsx
<AnalyticsProvider />
```

---

## 3. CloudFront CDN Setup

### Architecture

```
User (global) → CloudFront edge (d2lm104xqxyxzb.cloudfront.net)
                    │
                    ├── /_next/static/*   → 1 year cache
                    ├── /img/*            → 24h cache
                    ├── /videos/*         → 24h cache
                    ├── /videos/hero/hls/*→ 24h cache
                    ├── /contact          → 2h cache (Host-keyed)
                    └── everything else   → NO cache (pass-through)
                    │
                    └──▶ Railway Amsterdam (3tsaygnl.up.railway.app)
```

**Critical design decision:** CloudFront forwards the `Host` header to Railway via a custom Origin Request Policy. This is required because the Next.js middleware (`src/middleware.ts`) reads `req.headers.get('host')` to detect subdomains and rewrite routes (e.g. `ngo.gaurav.one` → `/domains/ngo/`). Without forwarding Host, all subdomain routing would break.

### AWS Resources Created

| Resource | ID / ARN |
|---|---|
| CloudFront Distribution | `E2RQCLGUZRUS6B` |
| CloudFront Domain | `d2lm104xqxyxzb.cloudfront.net` |
| ACM Wildcard Certificate | `arn:aws:acm:us-east-1:598888049190:certificate/75d2074b-b16f-4989-af36-eeaaa7c847ba` |
| Cache Policy — static (1yr) | `ba4f46b5-86f6-43ba-aa72-a83027b09234` |
| Cache Policy — pages (2h) | `eb3ccf5e-11da-459c-806e-fadaa21a853d` |
| Cache Policy — media (24h) | `14f9f5a8-1b7c-4379-9749-8cec946520be` |
| Origin Request Policy | `ae97d0a5-5f85-4778-97e3-5412e251d986` |

### Cache Behaviors (priority order)

| Path Pattern | TTL | Cache Key |
|---|---|---|
| `/_next/static/*` | 31,536,000s (1yr) | path only (content-hashed filenames) |
| `/videos/hero/hls/*` | 86,400s (24h) | path only |
| `/img/*` | 86,400s (24h) | path only |
| `/videos/*` | 86,400s (24h) | path only |
| `/contact` | 7,200s (2h) | path + Host header |
| `*` (default) | 0 (no cache) | — all headers/cookies forwarded |

**Why Host in cache key for `/contact` and `/`?**  
The default behavior caches per path. Without including `Host`, `gaurav.one/` and `ngo.gaurav.one/` would share the same cache entry and serve wrong content to each other.

### ACM Certificate
- Covers: `gaurav.one` and `*.gaurav.one`
- Region: `us-east-1` (required for CloudFront)
- Validated via existing DNS CNAME already in Route53

### Route53 Changes Made
All 8 domains switched from CNAME (pointing to Railway directly) to A + AAAA ALIAS records pointing to CloudFront. Done atomically (DELETE old CNAME + CREATE ALIAS in one batch).

| Domain | Before | After |
|---|---|---|
| `gaurav.one` | A ALIAS → old CloudFront (S3) | A ALIAS → new CloudFront |
| `www.gaurav.one` | CNAME → `3tsaygnl.up.railway.app` | A ALIAS → CloudFront |
| `ngo.gaurav.one` | CNAME → `qf1am3f4.up.railway.app` | A ALIAS → CloudFront |
| `opensource.gaurav.one` | CNAME → `3tsaygnl.up.railway.app` | A ALIAS → CloudFront |
| `vision.gaurav.one` | CNAME → `pu4talta.up.railway.app` | A ALIAS → CloudFront |
| `whitelabel.gaurav.one` | CNAME → `arvfzeo5.up.railway.app` | A ALIAS → CloudFront |
| `careers.gaurav.one` | CNAME → `qf1am3f4.up.railway.app` | A ALIAS → CloudFront |
| `casestudy.gaurav.one` | CNAME → `yz3u1hvb.up.railway.app` | A ALIAS → CloudFront |

**Not touched:** `webmail.gaurav.one`, `mail.gaurav.one`, `blogs.gaurav.one`, MX, TXT, DKIM, SPF records.

### Origin
Single origin: `3tsaygnl.up.railway.app` (the main Railway deployment).  
All subdomain traffic routes through this one app — the Next.js middleware handles the rewriting internally based on the forwarded Host header.

### Old Distribution
The old CloudFront distribution (`EVG0UKLGPAHJ0`, pointing to S3) had its `gaurav.one` alias removed to allow the new distribution to claim it. The old distribution itself was not deleted — it can be deleted manually via:
```bash
./scripts/aws/delete-old-distribution.sh
```

---

## 4. Cache Invalidation on Deploy

### GitHub Actions Workflow
**File:** `.github/workflows/invalidate-cdn.yml`

Triggers on every push to `production` branch. Runs `aws cloudfront create-invalidation` for `/` and `/contact`. Static assets (`/_next/static/*`) are never invalidated — their filenames are content-hashed so old and new can coexist safely.

**Secrets required in GitHub repo:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

The distribution ID is hardcoded as `E2RQCLGUZRUS6B`.

### Manual Invalidation
```bash
./scripts/aws/invalidate.sh
# or
aws cloudfront create-invalidation \
  --distribution-id E2RQCLGUZRUS6B \
  --paths "/" "/contact"
```

### TTL Tradeoff
- With GitHub Actions running on every deploy: pages update within ~60 seconds.
- Without it (fallback): pages update within 2 hours (the cache TTL).
- Static assets: never need invalidation, cached for 1 year safely.

---

## 5. Scripts Reference

All scripts are in `scripts/aws/`:

| Script | Purpose |
|---|---|
| `invalidate.sh` | Manually purge HTML page cache |
| `delete-old-distribution.sh` | Disable + delete old S3-backed CF distribution |
| `cloudfront-config.sh` | Reference: how policies/distribution were created |
| `create-distribution.sh` | Reference: how to recreate distribution if needed |
| `validate-cert.sh` | Reference: how to add ACM DNS validation to Route53 |

---

## 6. IAM Permissions Used (CLI user: `ubutun-cli-access`)

| Service | Permissions |
|---|---|
| CloudFront | Full (`cloudfront:*`) |
| Route53 | Full read + `route53:ChangeResourceRecordSets` |
| ACM | `acm:RequestCertificate`, `acm:DescribeCertificate`, `acm:ListCertificates` |

---

## 7. Domains NOT Behind CloudFront

| Domain | Status |
|---|---|
| `webmail.gaurav.one` | Directly on Railway — excluded from CDN intentionally (dynamic mail app) |
| `blogs.gaurav.one` | Points to `hashnode.network` — external, not Railway |
| `me.gaurav.one` | Still CNAME to Railway directly (not in CDN scope) |
| `chat.gaurav.one` | Not configured in Route53 / not in CDN scope |
