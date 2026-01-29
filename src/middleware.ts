import { NextRequest, NextResponse } from 'next/server';

// Configuration for subdomains
const SUBDOMAIN_CONFIG = {
  // Redirect subdomains - these redirect to external URLs
  redirects: {
    github: 'https://github.com/AstroX11',
    linkedin: 'https://linkedin.com/in/AstroX11',
  },
  // Valid subdomains that have their own pages
  valid: ['me', 'opensource', 'vision', 'casestudy', 'whitelabel', 'blogs', 'careers', 'ngo'],
} as const;

// Get the root domain from environment or default
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'gaurav.one';

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Handle localhost development
  // me.localhost:3000 -> subdomain = 'me'
  // localhost:3000 -> subdomain = null (root)
  let subdomain: string | null = null;

  const isLocalDev = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('lvh.me');

  if (isLocalDev) {
    // Development: extract subdomain from localhost or lvh.me
    // e.g., me.localhost:3000 -> 'me'
    // e.g., me.lvh.me:3000 -> 'me'
    const hostnameWithoutPort = hostname.split(':')[0];
    const parts = hostnameWithoutPort.split('.');

    // For lvh.me: me.lvh.me has 3 parts ['me', 'lvh', 'me'], lvh.me has 2 parts
    // For localhost: me.localhost has 2 parts, localhost has 1 part
    if (hostname.includes('lvh.me')) {
      if (parts.length > 2 && parts[0] !== 'www') {
        subdomain = parts[0];
      }
    } else if (parts.length > 1 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  } else {
    // Production: extract subdomain from actual domain
    // e.g., me.gaurav.one -> 'me'
    const hostnameWithoutPort = hostname.split(':')[0];

    if (hostnameWithoutPort === ROOT_DOMAIN || hostnameWithoutPort === `www.${ROOT_DOMAIN}`) {
      subdomain = null; // Root domain
    } else if (hostnameWithoutPort.endsWith(`.${ROOT_DOMAIN}`)) {
      subdomain = hostnameWithoutPort.replace(`.${ROOT_DOMAIN}`, '');
    }
  }

  // Handle external redirects
  if (subdomain && subdomain in SUBDOMAIN_CONFIG.redirects) {
    const redirectUrl = SUBDOMAIN_CONFIG.redirects[subdomain as keyof typeof SUBDOMAIN_CONFIG.redirects];
    return NextResponse.redirect(redirectUrl);
  }

  // Root domain - serve from /(root)
  if (!subdomain) {
    // Rewrite to /(root) route group
    // The (root) folder is for organization only, doesn't affect URL
    return NextResponse.next();
  }

  // Valid subdomains - rewrite to /domains/[subdomain]/...
  if (SUBDOMAIN_CONFIG.valid.includes(subdomain as typeof SUBDOMAIN_CONFIG.valid[number])) {
    url.pathname = `/domains/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Unknown subdomain - redirect to root
  let rootUrl: URL;
  if (hostname.includes('lvh.me')) {
    rootUrl = new URL(`http://lvh.me:${url.port || 3000}`);
  } else if (hostname.includes('localhost')) {
    rootUrl = new URL(`http://localhost:${url.port || 3000}`);
  } else {
    rootUrl = new URL(`https://${ROOT_DOMAIN}`);
  }
  return NextResponse.redirect(rootUrl);
}
