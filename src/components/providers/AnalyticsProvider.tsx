"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import analyticsConfig from "@/config/analytics";

function isTrackingExcluded(pathname: string): boolean {
  const { EXCLUDED_PATHS, EXCLUDED_SUBDOMAINS } = analyticsConfig;

  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return true;

  if (typeof window !== "undefined") {
    const subdomain = window.location.hostname.split(".")[0];
    if (EXCLUDED_SUBDOMAINS.includes(subdomain as any)) return true;
  }

  return false;
}

export default function AnalyticsProvider() {
  const pathname = usePathname();

  if (isTrackingExcluded(pathname)) return null;

  const { GA_ID, GTM_ID } = analyticsConfig;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-script" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
