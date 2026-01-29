import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gaurav.one | Building Digital Experiences",
  description: "We build exceptional digital products and experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" id="root-node">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
