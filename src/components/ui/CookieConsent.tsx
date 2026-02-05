"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { BsShieldCheck } from "react-icons/bs";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setIsLoaded(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
    // Enable analytics, tracking, etc.
    // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setShowBanner(false);
    // Disable analytics, tracking, etc.
    // window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-obsidian-50 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon */}
                <div className="hidden sm:flex w-12 h-12 bg-cyan/10 rounded-xl items-center justify-center flex-shrink-0">
                  <BsShieldCheck className="w-6 h-6 text-cyan" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-primaryDark dark:text-white mb-1">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-primaryDark/70 dark:text-gray-400">
                    We use cookies to enhance your browsing experience, analyze site traffic,
                    and personalize content. By clicking "Accept All", you consent to our use of cookies.{" "}
                    <a
                      href="#"
                      className="text-cyan hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // Open privacy policy or cookie settings
                      }}
                    >
                      Learn more
                    </a>
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleReject}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-primaryDark dark:text-gray-300 bg-gray-100 dark:bg-obsidian hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-obsidian bg-cyan hover:bg-cyan/90 rounded-lg transition-colors"
                  >
                    Accept All
                  </button>
                </div>

                {/* Close Button (Mobile) */}
                <button
                  onClick={handleReject}
                  className="absolute top-3 right-3 sm:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to check consent status
export function useCookieConsent(): ConsentStatus {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored);
    }
  }, []);

  return consent;
}
