import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { Inter, Cinzel_Decorative } from "next/font/google";
import ChatKitWrapper from "@/components/providers/ChatKitWrapper";
import ChatBotProvider from "@/components/providers/ChatBotProvider";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";

const inter = Inter({ subsets: ["latin"] });

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  display: "swap",
});

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
    <html lang="en" id="root-node" className={cinzelDecorative.variable}>
      <body className={inter.className}>
        <AnalyticsProvider />
        <ChatKitWrapper>
          {children}
          <ChatBotProvider />
        </ChatKitWrapper>
      </body>
    </html>
  );
}
