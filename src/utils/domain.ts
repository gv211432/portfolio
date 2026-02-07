/**
 * Shared domain extraction utility.
 * Single source of truth for parsing the root domain from NEXT_PUBLIC_ROOT_DOMAIN.
 * Used by middleware, cookie utils, and global config.
 */

const RAW_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "www.gaurav.one")
  .replace("http://", "")
  .replace("https://", "")
  .split(":")[0]; // remove port if any

/** Base root domain, e.g. "gaurav.one" or "localhost" */
export const ROOT_DOMAIN = RAW_DOMAIN.split(".").slice(-2).join(".");

/** Whether the current environment is local development */
export const isLocalDev =
  ROOT_DOMAIN.includes("localhost") ||
  ROOT_DOMAIN.includes("127.0.0.1") ||
  ROOT_DOMAIN.includes("lvh.me");
