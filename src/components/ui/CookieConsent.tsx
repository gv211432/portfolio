"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsShieldCheck } from "react-icons/bs";
import { getCookie, setCookie } from "@/utils/cookies";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isNgo, setIsNgo] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsNgo(hostname.startsWith("ngo.") || hostname.startsWith("ngo-"));
  }, []);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getCookie(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
    (window as any).dataLayer?.push({ event: "consent_accepted" });
  };

  const handleReject = () => {
    setCookie(COOKIE_CONSENT_KEY, "rejected");
    setShowBanner(false);
    (window as any).dataLayer?.push({ event: "consent_rejected" });
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Dark overlay covering top 30% of viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 20%, transparent 30%)",
            }}
          />

          {/* Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-obsidian-50 shadow-[0_-8px_30px_rgba(0,0,0,0.3)] border-t border-gray-200 dark:border-gray-700 px-4 py-3"
          >
            <div className="w-full">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <BsShieldCheck className={`w-5 h-5 flex-shrink-0 ${isNgo ? "text-[#20c997]" : "text-cyan"}`} />
                  <p className="text-sm text-primaryDark/70 dark:text-gray-400">
                    We use cookies to enhance your experience. By using our website, you agree to our{" "}
                    <a href="/privacy" className={`${isNgo ? "text-[#20c997]" : "text-cyan"} hover:underline`}>
                      Privacy Policy
                    </a>.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleReject}
                    className="px-4 py-1.5 text-sm font-medium text-primaryDark dark:text-gray-300 bg-gray-100 dark:bg-obsidian hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAccept}
                    className={`px-4 py-1.5 text-sm font-medium text-obsidian rounded-lg transition-colors ${
                      isNgo ? "bg-[#20c997] hover:bg-[#20c997]/90" : "bg-cyan hover:bg-cyan/90"
                    }`}
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to check consent status
export function useCookieConsent(): ConsentStatus {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    const stored = getCookie(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored);
    }
  }, []);

  return consent;
}
