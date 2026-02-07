const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

let scriptLoaded = false;

/**
 * Dynamically load the reCAPTCHA v3 script if not already loaded.
 */
function loadRecaptchaScript(): Promise<void> {
  if (scriptLoaded && (window as any).grecaptcha) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);
  });
}

/**
 * Remove the reCAPTCHA script and badge from the DOM.
 */
function unloadRecaptcha(): void {
  // Remove the script tag
  const scripts = document.querySelectorAll(`script[src*="recaptcha/api.js"]`);
  scripts.forEach((s) => s.remove());

  // Remove the badge
  const badges = document.querySelectorAll(".grecaptcha-badge");
  badges.forEach((b) => (b as HTMLElement).parentElement?.remove());

  // Remove the global object
  delete (window as any).grecaptcha;
  scriptLoaded = false;
}

/**
 * Client-side: Get a reCAPTCHA v3 token for the given action.
 * Loads the script on-demand and removes it after getting the token.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }
    grecaptcha.ready(() => {
      grecaptcha
        .execute(SITE_KEY, { action })
        .then((token: string) => {
          // Clean up after getting the token
          setTimeout(unloadRecaptcha, 500);
          resolve(token);
        })
        .catch(reject);
    });
  });
}

/**
 * Server-side: Verify a reCAPTCHA v3 token.
 * Returns the score (0.0 - 1.0) or null if verification failed.
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; score: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY not configured");
    return { success: false, score: 0 };
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  });

  const data = await response.json();

  if (!data.success) {
    console.error("reCAPTCHA verification failed:", data["error-codes"]);
    return { success: false, score: 0 };
  }

  if (expectedAction && data.action !== expectedAction) {
    console.error(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
    return { success: false, score: 0 };
  }

  return { success: true, score: data.score };
}
