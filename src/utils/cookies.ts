/**
 * Cross-subdomain cookie utilities.
 * Sets cookies on the root domain (.gaurav.one) so they are
 * shared across all subdomains (me.gaurav.one, careers.gaurav.one, etc.).
 */

const RAW_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "gaurav.one")
  .replace("http://", "")
  .replace("https://", "")
  .split(":")[0]; // remove port if any
const ROOT_DOMAIN = RAW_DOMAIN.split(".").slice(-2).join("."); // e.g., "gaurav.one"

function getCookieDomain(): string {
  if (typeof window === "undefined") return "";
  const hostname = window.location.hostname;
  // For local dev, don't set domain (cookies work on localhost by default)
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) return "";
  // For lvh.me local testing
  if (hostname.endsWith("lvh.me")) return ".lvh.me";
  // Production: set on root domain (e.g., .gaurav.one)
  return `.${ROOT_DOMAIN}`;
}

export function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const domain = getCookieDomain();
  const domainStr = domain ? `; domain=${domain}` : "";
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainStr}; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  const domain = getCookieDomain();
  const domainStr = domain ? `; domain=${domain}` : "";
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainStr}`;
}

/**
 * Zustand-compatible storage adapter using cross-subdomain cookies.
 * Use with: persist(storeFunc, { name: "key", storage: cookieStorage })
 */
export const cookieStorage = {
  getItem: (name: string): string | null => {
    return getCookie(name);
  },
  setItem: (name: string, value: string): void => {
    setCookie(name, value);
  },
  removeItem: (name: string): void => {
    removeCookie(name);
  },
};
