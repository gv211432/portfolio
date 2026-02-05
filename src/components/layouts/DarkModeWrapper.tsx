"use client";

import React, { useEffect } from "react";
import { useDarkModeStore } from "@/Atoms/globalAtoms";

interface DarkModeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DarkModeWrapper - Provides consistent dark mode container for domain pages
 * Handles the dark mode class on document and wraps content with proper background
 */
export default function DarkModeWrapper({ children, className = "" }: DarkModeWrapperProps) {
  const { darkMode } = useDarkModeStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""} ${className}`}>
      <div className="bg-light dark:bg-obsidian text-primaryDark dark:text-white transition-colors duration-300 min-h-screen">
        {children}
      </div>
    </div>
  );
}
