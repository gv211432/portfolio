"use client";

export default function RecaptchaBadge() {
  return (
    <p className="text-xs text-center text-primaryDark/40 dark:text-gray-500 mt-3">
      Protected by reCAPTCHA.{" "}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
        Privacy
      </a>
      {" & "}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
        Terms
      </a>
    </p>
  );
}
