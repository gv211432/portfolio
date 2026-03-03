/** @type {import('next').NextConfig} */
const nextConfig = {
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
  serverExternalPackages: [
    '@copilotkitnext/runtime',
    '@copilotkitnext/agent',
    '@copilotkitnext/shared',
    'graphql-yoga',
    '@graphql-yoga/plugin-content-type-parser',
    '@whatwg-node/server',
    '@whatwg-node/fetch',
  ],
};

module.exports = nextConfig;
