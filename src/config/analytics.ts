const analyticsConfig = {
  GA_ID: "G-QLX1NFZ695",
  GTM_ID: "GTM-T3ZKK9HQ",

  // Pathname prefixes that should NOT be tracked
  EXCLUDED_PATHS: ["/admin"],

  // Subdomains that should NOT be tracked (e.g. "webmail" matches webmail.gaurav.one)
  EXCLUDED_SUBDOMAINS: ["webmail", "mail"],
} as const;

export default analyticsConfig;
