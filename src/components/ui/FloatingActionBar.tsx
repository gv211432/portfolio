"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoSend, IoMoon, IoSunny, IoArrowUp } from "react-icons/io5";
import { BsChatDotsFill } from "react-icons/bs";
import { FaTelegram } from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { globalConfig } from "@/config/global";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { darkMode, toggleDarkMode, initializeDarkMode } = useDarkModeStore();
  const accent = useSubdomainAccent();

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button when user scrolls down (supports both window and container scroll)
  useEffect(() => {
    const container = document.querySelector("[data-scroll-container]");
    const handleScroll = () => {
      const scrollY = container ? (container as HTMLElement).scrollTop : window.scrollY;
      setShowScrollTop(scrollY > 300);
    };
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
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

  // Initialize dark mode on mount
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm here to help you learn more about Gaurav's services. Ask me anything!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.message ||
          "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 bg-white/90 dark:bg-obsidian/90 backdrop-blur-md rounded-full px-2 py-2 shadow-lg border border-gray-200 dark:border-gray-700"
        >
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

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

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

        {/* Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all group ${
            accent ? "" : "bg-cyan hover:bg-cyan/80"
          }`}
          style={accent ? { backgroundColor: accent } : undefined}
          aria-label="Open chat"
        >
          <BsChatDotsFill className="w-5 h-5 text-obsidian group-hover:scale-110 transition-transform" />
        </button>
        </motion.div>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[450px] sm:h-[500px] bg-white dark:bg-obsidian rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 text-obsidian ${accent ? "" : "bg-cyan"}`}
              style={accent ? { backgroundColor: accent } : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">G</span>
                </div>
                <div>
                  <h3 className="font-semibold">Gaurav's Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-obsidian/70">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-obsidian-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user"
                        ? `${accent ? "" : "bg-cyan"} text-obsidian rounded-br-md`
                        : "bg-white dark:bg-obsidian border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md"
                    }`}
                    style={message.role === "user" && accent ? { backgroundColor: accent } : undefined}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span
                      className={`text-[10px] mt-1 block ${
                        message.role === "user"
                          ? "text-obsidian/60"
                          : "text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-obsidian border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-obsidian border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-obsidian-50 rounded-full text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    input.trim() ? (accent ? "" : "bg-cyan") : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  style={input.trim() && accent ? { backgroundColor: accent } : undefined}
                  aria-label="Send message"
                >
                  <IoSend
                    className={`w-5 h-5 ${
                      input.trim() ? "text-obsidian" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Powered by AI • {globalConfig.displayName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
