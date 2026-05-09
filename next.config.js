/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Videos — long cache, revalidate via ETag/Last-Modified
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, stale-while-revalidate=86400" },
          { key: "Accept-Ranges", value: "bytes" }, // enables video seeking
        ],
      },
      {
        // Images in /img/ — 30 days, revalidate in background
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  // Removed 'output: "export"' to enable middleware support
  // Pages will still be statically generated where possible (SSG/ISR)
  images: {
    unoptimized: true,
  },
  // Environment variables for subdomain routing
  env: {
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000',
  },
  // These packages are ESM-only (type: module) and cannot be bundled
  // by webpack in CJS server mode — keep them as native Node.js requires.
  // These packages are ESM-only or bundle their own React fork — keep them
  // as native Node.js requires so webpack doesn't re-bundle them.
  serverExternalPackages: [
    '@copilotkitnext/runtime',
    '@copilotkitnext/agent',
    '@copilotkitnext/shared',
    'graphql-yoga',
    '@graphql-yoga/plugin-content-type-parser',
    '@whatwg-node/server',
    '@whatwg-node/fetch',
    // pdfkit loads font .afm files via relative paths — must NOT be bundled
    // or those paths break inside .next/server/vendor-chunks/
    'pdfkit',
  ],
};

module.exports = nextConfig;
