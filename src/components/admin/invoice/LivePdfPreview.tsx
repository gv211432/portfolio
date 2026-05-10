"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfInvoiceData } from "@/lib/invoice/pdf";

const A4_RATIO = 841.89 / 595.28; // height / width ≈ 1.4142

interface Props {
  data: PdfInvoiceData;
}

export default function LivePdfPreview({ data }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const prevUrlRef    = useRef<string | null>(null);
  const [iframeUrl, setIframeUrl]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [containerW, setContainerW]   = useState(0);

  // Measure container width (needed for page-break position)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(containerRef.current);
    setContainerW(containerRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Debounced PDF generation — fires 1.2 s after last data change
  useEffect(() => {
    const body = JSON.stringify(data);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/invoices/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        setIframeUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        prevUrlRef.current = url;
      } catch { /* non-fatal */ }
      finally   { setLoading(false); }
    }, 1200);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  // Revoke blob URL on unmount
  useEffect(() => () => { if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current); }, []);

  const pageH   = containerW  * A4_RATIO;          // px height of one A4 page
  const totalH  = Math.max(pageH * 4, 800);         // reserve space for up to 4 pages

  return (
    <div ref={containerRef} className="relative">
      {/* Loading badge */}
      {loading && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Updating…
        </div>
      )}

      {/* PDF iframe */}
      {iframeUrl ? (
        <iframe
          key={iframeUrl}
          src={iframeUrl}
          title="Invoice Preview"
          style={{ width: "100%", height: totalH, border: "none", display: "block" }}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center text-gray-400 gap-3 bg-gray-50 dark:bg-slate-900 rounded-xl"
          style={{ height: pageH }}
        >
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Generating preview…</span>
        </div>
      )}

    </div>
  );
}
