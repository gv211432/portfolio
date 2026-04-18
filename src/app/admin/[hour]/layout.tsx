/**
 * Admin section layout — minimal wrapper.
 * Hides the public chatbot FAB and any marketing UI while keeping Next.js root layout intact.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Gaurav.One",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Suppress the public chatbot FAB in admin via CSS */}
      <style>{`
        /* Hide public-facing UI elements in admin */
        [data-copilot-kit], .copilotkit-popup, .copilotkit-button,
        [class*="FloatingActionBar"], [class*="ChatBot"] {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
