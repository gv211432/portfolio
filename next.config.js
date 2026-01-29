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
};

module.exports = nextConfig;
