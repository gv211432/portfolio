/**
 * Mail app layout — suppresses public chrome (chatbot FAB, marketing UI)
 * so /mail and /mail/login run as a clean standalone app.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mail | Gaurav.One",
  robots: { index: false, follow: false },
};

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        [data-copilot-kit], .copilotkit-popup, .copilotkit-button,
        [class*="FloatingActionBar"], [class*="ChatBot"] { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
