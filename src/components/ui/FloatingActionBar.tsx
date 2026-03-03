"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMoon, IoSunny, IoArrowUp, IoContract, IoHome } from "react-icons/io5";
import { IoMdExpand } from "react-icons/io";
import { FaTelegram } from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { useDarkModeStore, useChatOpenStore } from "@/Atoms/globalAtoms";
import { globalConfig, domainUrls } from "@/config/global";
import { IoChatbubbleEllipses } from "react-icons/io5";

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
  const [isHomePage, setIsHomePage] = useState(false);

  // Detect homepage
  useEffect(() => {
    const hostname = window.location.hostname;
    setIsHomePage(hostname === "gaurav.one" || hostname === "www.gaurav.one");
  }, []);

  // Persist vertical state
  useEffect(() => {
    localStorage.setItem("fab-vertical", String(isVertical));
  }, [isVertical]);

  // Show scroll-to-top button when user scrolls down
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

  return (
    <div
      className={`fixed z-50 ${
        isVertical
          ? "bottom-4 right-6"
          : "bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6"
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isVertical ? "vertical" : "horizontal"}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`flex gap-2 bg-white/90 dark:bg-obsidian/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 ${
            isVertical
              ? "flex-col items-center rounded-[1.75rem] px-2 py-2"
              : "items-center rounded-full px-2 py-2"
          }`}
        >
          {/* Pinch/Expand Toggle — Desktop only */}
          <button
            onClick={() => setIsVertical(!isVertical)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:flex items-center justify-center transition-all group mx-auto"
            aria-label={isVertical ? "Expand bar" : "Collapse bar"}
          >
            {isVertical ? (
              <IoMdExpand className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            ) : (
              <IoContract className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            )}
          </button>

          {/* Home Button — hidden on homepage */}
          {!isHomePage && (
            <a
              href={domainUrls.root}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-100 dark:bg-obsidian-50 hover:bg-gray-200 dark:hover:bg-gray-700 hidden lg:flex items-center justify-center transition-all group"
              aria-label="Go to home"
            >
              <IoHome className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
            </a>
          )}

          {/* Email Button */}
          <a
            href={`mailto:${globalConfig.email}`}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all group"
            aria-label="Send email"
          >
            <HiMail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </a>

          {/* Telegram Button */}
          <a
            href="https://t.me/gaaaalileo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 flex items-center justify-center transition-all group"
            aria-label="Contact on Telegram"
          >
            <FaTelegram className="w-5 h-5 text-[#0088cc] group-hover:scale-110 transition-transform" />
          </a>

          {/* AI Chat Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
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

          {/* Divider */}
          <div
            className={
              isVertical
                ? "h-px w-6 mx-auto bg-gray-300 dark:bg-gray-600"
                : "w-px h-6 bg-gray-300 dark:bg-gray-600"
            }
          />

          {/* Dark Mode Toggle */}
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

          {/* Scroll to Top Button */}
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
