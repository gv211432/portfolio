import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat with Gaurav's AI Assistant",
  description: "Full-page AI chat — ask anything about Gaurav's blockchain development services, projects, and expertise.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-dvh overflow-hidden bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
