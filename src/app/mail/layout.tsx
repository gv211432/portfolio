import type { Metadata } from "next";
import PwaRegistrar from "@/components/mail/PwaRegistrar";

export const metadata: Metadata = {
  title: "Mail | Gaurav.One",
  robots: { index: false, follow: false },
  manifest: "/mail-manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    title: "Webmail",
    statusBarStyle: "black-translucent",
  },
};

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        [data-copilot-kit], .copilotkit-popup, .copilotkit-button,
        [class*="FloatingActionBar"], [class*="ChatBot"] { display: none !important; }
      `}</style>
      <PwaRegistrar />
      {children}
    </>
  );
}
