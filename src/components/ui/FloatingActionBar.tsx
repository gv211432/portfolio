"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoMoon, IoSunny, IoArrowUp, IoHome,
  IoArrowRedoOutline, IoArrowUndoOutline,
  IoChatbubbleEllipses,
} from "react-icons/io5";
import { FaTelegram } from "react-icons/fa";
import { HiMail, HiChevronDoubleRight, HiChevronDoubleLeft } from "react-icons/hi";
import { useDarkModeStore, useChatOpenStore } from "@/Atoms/globalAtoms";
import { globalConfig, domainUrls } from "@/config/global";

function useSubdomainAccent() {
  const [accent, setAccent] = useState<string | undefined>(undefined);
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.startsWith("ngo.") || hostname.startsWith("ngo-")) {
      setAccent("#20c997");
    } else if (hostname.startsWith("me.") || hostname.startsWith("me-")) {
      setAccent("#8b94cb");
    }
  }, []);
  return accent;
}

export default function FloatingActionBar() {
  const { darkMode, toggleDarkMode, initializeDarkMode } = useDarkModeStore();
  const { isChatOpen, setIsChatOpen } = useChatOpenStore();
  const accent = useSubdomainAccent();

  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isVertical, setIsVertical] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fab-vertical") === "true";
    }
    return false;
  });

  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fab-hidden") === "true";
    }
    return false;
  });

  const [isHomePage, setIsHomePage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsHomePage(hostname === "gaurav.one" || hostname === "www.gaurav.one");
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    localStorage.setItem("fab-vertical", String(isVertical));
  }, [isVertical]);

  useEffect(() => {
    localStorage.setItem("fab-hidden", String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    const container = document.querySelector("[data-scroll-container]");
    const handleScroll = () => {
      const scrollY = container ? (container as HTMLElement).scrollTop : window.scrollY;
      setShowScrollTop(scrollY > 300);
    };
    if (container) container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    const container = document.querySelector("[data-scroll-container]");
    if (container) (container as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  // Hide entire FAB on mobile while chat is open
  if (isMobile && isChatOpen) return null;

  return (
    <>
      {/* ── Pull-tab — visible only when bar is hidden ─────────────────── */}
      <AnimatePresence>
        {isHidden && (
          <motion.button
            key="fab-pull"
            initial={{ x: 52, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 52, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={() => setIsHidden(false)}
            aria-label="Show quick bar"
            className="fixed bottom-6 right-0 z-50 flex items-center justify-center bg-white/90 dark:bg-obsidian/90 backdrop-blur-md shadow-lg border border-r-0 border-gray-200 dark:border-gray-700 rounded-l-xl pl-2 pr-1.5 py-4"
          >
            <HiChevronDoubleLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Main bar ────────────────────────────────────────────────────── */}
      <div
        className={`fixed z-50 ${
          isVertical
            ? "bottom-4 right-6"
            : "bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6"
        }`}
      >
        <AnimatePresence mode="wait">
          {!isHidden && (
            <motion.div
              key={isVertical ? "vertical" : "horizontal"}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, x: 12 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`flex gap-2 bg-white/90 dark:bg-obsidian/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 ${
                isVertical
                  ? "flex-col items-center rounded-[1.75rem] px-2 py-2"
                  : "items-center rounded-full px-2 py-2"
              }`}
            >
              {/* ── Orientation toggle — desktop only ── */}
              {/* When horizontal → show right-turn arrow (make vertical)   */}
              {/* When vertical   → show left-turn arrow  (make horizontal) */}
              <button
                onClick={() => setIsVertical(!isVertical)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:flex items-center justify-center transition-all group mx-auto"
                aria-label={isVertical ? "Switch to horizontal" : "Switch to vertical"}
              >
                {isVertical ? (
                  <IoArrowUndoOutline className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                ) : (
                  <IoArrowRedoOutline className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                )}
              </button>

              {/* ── Home button — hidden on homepage ── */}
              {!isHomePage && (
                <a
                  href={domainUrls.root}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 dark:bg-obsidian-50 hover:bg-gray-200 dark:hover:bg-gray-700 hidden lg:flex items-center justify-center transition-all group"
                  aria-label="Go to home"
                >
                  <IoHome className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                </a>
              )}

              {/* ── Email ── */}
              <a
                href={`mailto:${globalConfig.email}`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all group"
                aria-label="Send email"
              >
                <HiMail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </a>

              {/* ── Telegram ── */}
              <a
                href="https://t.me/gaaaalileo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 flex items-center justify-center transition-all group"
                aria-label="Contact on Telegram"
              >
                <FaTelegram className="w-5 h-5 text-[#0088cc] group-hover:scale-110 transition-transform" />
              </a>

              {/* ── AI Chat ── */}
              <button
                onClick={() => {
                  const opening = !isChatOpen;
                  // On desktop, switch to horizontal layout when opening chat
                  if (opening && isVertical && !isMobile) setIsVertical(false);
                  setIsChatOpen(opening);
                }}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all group ${
                  isChatOpen
                    ? "bg-primary text-obsidian shadow-[0_0_12px_rgba(0,212,255,0.5)]"
                    : "bg-primary/10 hover:bg-primary/20"
                }`}
                aria-label="Open AI assistant"
              >
                <IoChatbubbleEllipses
                  className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                    isChatOpen ? "text-obsidian" : "text-primary"
                  }`}
                />
              </button>

              {/* ── Divider ── */}
              <div
                className={
                  isVertical
                    ? "h-px w-6 mx-auto bg-gray-300 dark:bg-gray-600"
                    : "w-px h-6 bg-gray-300 dark:bg-gray-600"
                }
              />

              {/* ── Dark mode toggle ── */}
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 dark:bg-obsidian-50 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all group"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <IoSunny className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                ) : (
                  <IoMoon className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" />
                )}
              </button>

              {/* ── Scroll to top ── */}
              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleScrollToTop}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 dark:bg-obsidian-50 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center group flex-shrink-0"
                    aria-label="Scroll to top"
                  >
                    <IoArrowUp className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Hide button (>>) ── */}
              <button
                onClick={() => setIsHidden(true)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-all group mx-auto"
                aria-label="Hide floating bar"
              >
                <HiChevronDoubleRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
