import { NextRequest } from "next/server";

const IS_DEV = process.env.NODE_ENV === "development";
const TEST_MODE_REAL_IP = "49.43.24.152";

interface DeviceInfo {
  deviceType: "mobile" | "desktop" | "tablet" | "unknown";
  os: "windows" | "macos" | "linux" | "android" | "ios" | "unknown";
  browser: string;
}

interface IpInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryName: string;
  loc: string;
  org: string;
  postal: string;
  timezone: string;
  currency: string;
}

function isValidIPv4(ip: string): boolean {
  return /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/.test(ip);
}

/**
 * Extract client IP from Next.js request headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (isValidIPv4(ip)) return IS_DEV ? TEST_MODE_REAL_IP : ip;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIPv4(realIp)) return IS_DEV ? TEST_MODE_REAL_IP : realIp;

  return IS_DEV ? TEST_MODE_REAL_IP : "127.0.0.1";
}

/**
 * Parse user agent string to extract device info.
 */
export function parseUserAgent(ua: string): DeviceInfo {
  let os: DeviceInfo["os"] = "unknown";
  if (/windows nt/i.test(ua)) os = "windows";
  else if (/mac os x/i.test(ua)) os = "macos";
  else if (/android/i.test(ua)) os = "android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "ios";
  else if (/linux/i.test(ua)) os = "linux";

  let deviceType: DeviceInfo["deviceType"] = "desktop";
  if (/mobile/i.test(ua)) deviceType = "mobile";
  else if (/tablet|ipad/i.test(ua)) deviceType = "tablet";

  let browser = "unknown";
  if (/edg/i.test(ua)) browser = "edge";
  else if (/chrome/i.test(ua)) browser = "chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "safari";
  else if (/firefox/i.test(ua)) browser = "firefox";

  return { deviceType, os, browser };
}

/**
 * Fetch IP geolocation info from ipinfo.io.
 * Returns null if the lookup fails.
 */
export async function getIpInfo(ip: string): Promise<IpInfo | null> {
  if (!isValidIPv4(ip)) return null;

  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;

    const data = await response.json();

    return {
      ip: data.ip,
      city: data.city || "",
      region: data.region || "",
      country: data.country || "",
      countryName: data.country || "",
      loc: data.loc || "",
      org: data.org || "",
      postal: data.postal || "",
      timezone: data.timezone || "",
      currency: "",
    };
  } catch {
    console.error("Failed to fetch IP info for:", ip);
    return null;
  }
}

/**
 * Collect all client info from a Next.js request.
 * IP info is fetched in the background to not block the response.
 */
export function collectClientInfo(request: NextRequest) {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") || "unknown";
  const deviceInfo = parseUserAgent(ua);

  return { ip, userAgent: ua, deviceInfo };
}
