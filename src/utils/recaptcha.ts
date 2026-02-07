const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

/**
 * Client-side: Get a reCAPTCHA v3 token for the given action.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha) {
      reject(new Error("reCAPTCHA not loaded"));
      return;
    }
    grecaptcha.ready(() => {
      grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(reject);
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
