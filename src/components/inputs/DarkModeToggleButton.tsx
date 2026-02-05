"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { FaSun, FaMoon } from "react-icons/fa";

/**
 * DarkModeToggleButton - Smooth liquid toggle for dark/light mode
 * Persists state to localStorage via Zustand
 */
export default function DarkModeToggleButton() {
  const { darkMode, toggleDarkMode, initializeDarkMode } = useDarkModeStore();

  // Initialize dark mode on mount
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-14 h-7 rounded-full bg-gradient-to-r from-primary/30 to-cyan/30 dark:from-obsidian-50 dark:to-obsidian p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 dark:hover:shadow-cyan/20 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-cyan/50"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track background with liquid gradient */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden"
        initial={false}
      >
        {/* Light mode gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200"
          animate={{
            opacity: darkMode ? 0 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        {/* Dark mode gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900"
          animate={{
            opacity: darkMode ? 1 : 0,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Liquid blob effect */}
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full shadow-lg"
        animate={{
          x: darkMode ? 28 : 0,
          scale: [1, 1.1, 1],
          backgroundColor: darkMode ? "#1a1a2e" : "#fbbf24",
        }}
        transition={{
          x: { type: "spring", stiffness: 500, damping: 30 },
          scale: { duration: 0.3 },
          backgroundColor: { duration: 0.4 },
        }}
        style={{
          boxShadow: darkMode
            ? "0 0 10px rgba(0, 217, 255, 0.5), inset 0 0 5px rgba(0, 217, 255, 0.3)"
            : "0 0 10px rgba(251, 191, 36, 0.5), inset 0 0 5px rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Icon inside the blob */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: darkMode ? 360 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {darkMode ? (
            <FaMoon className="w-3 h-3 text-cyan" />
          ) : (
            <FaSun className="w-3 h-3 text-amber-600" />
          )}
        </motion.div>
      </motion.div>

      {/* Stars effect for dark mode */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
        animate={{ opacity: darkMode ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              opacity: darkMode ? [0.3, 1, 0.3] : 0,
              scale: darkMode ? [1, 1.5, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </button>
  );
}
