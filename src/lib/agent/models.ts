/**
 * Gemini model configs with free-tier allowances (as of Mar 2026).
 * Switch ACTIVE_MODEL to change the model used by the agent.
 *
 * Free tier limits (RPM / TPM / RPD):
 *   gemini-2.5-flash        →  5 RPM  | 250K TPM |    20 RPD  — Best quality; very low daily cap
 *   gemini-2.5-flash-lite   → 10 RPM  | 250K TPM |    20 RPD  — Faster/cheaper; same low daily cap
 *   gemma-3-27b-it          → 30 RPM  |  15K TPM | 14.4K RPD  — Highest daily cap; smaller context window
 *   gemma-3-12b-it          → 30 RPM  |  15K TPM | 14.4K RPD  — Same limits, lighter model
 *   gemini-2.0-flash        →  0 RPM  |     0 TPM |     0 RPD  — Paid only
 *   gemini-2.0-flash-lite   →  0 RPM  |     0 TPM |     0 RPD  — Paid only
 *   gemini-2.5-pro          →  0 RPM  |     0 TPM |     0 RPD  — Paid only
 */
export const GEMINI_MODELS = {
  // Free tier — best reasoning quality; 20 req/day ceiling
  FLASH_25: "gemini-2.5-flash-preview-04-17",

  // Free tier — lighter/faster than 2.5 Flash; same 20 req/day ceiling
  FLASH_25_LITE: "gemini-2.5-flash-lite-preview-06-17",

  // Free tier — 14,400 req/day but 15K TPM (tight for large system prompts)
  GEMMA_27B: "gemma-3-27b-it",
  GEMMA_12B: "gemma-3-12b-it",

  // Paid only
  FLASH_20: "gemini-2.0-flash",
  FLASH_20_LITE: "gemini-2.0-flash-lite",
  PRO_25: "gemini-2.5-pro",
} as const;

/**
 * Change this single line to switch models across the entire agent.
 * Recommended for portfolio (free tier): GEMINI_MODELS.FLASH_25
 */
export const ACTIVE_MODEL = GEMINI_MODELS.FLASH_25;
