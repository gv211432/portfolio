"use client";

import React from "react";
import { FaTelegram } from "react-icons/fa";
import { HiMail } from "react-icons/hi";

interface ContactDetailsProps {
  /** Layout variant */
  variant?: "horizontal" | "vertical";
  /** Show labels */
  showLabels?: boolean;
  /** Additional className */
  className?: string;
  /** Compact mode for header */
  compact?: boolean;
}

/**
 * ContactDetails - Displays contact info (Telegram & Email)
 * For use in headers and footers
 */
export default function ContactDetails({
  variant = "horizontal",
  showLabels = false,
  className = "",
  compact = false,
}: ContactDetailsProps) {
  const containerClasses =
    variant === "horizontal"
      ? "flex items-center gap-4"
      : "flex flex-col gap-3";

  const linkClasses = compact
    ? "flex items-center gap-2 text-sm text-primaryDark/70 dark:text-gray-400 hover:text-primary dark:hover:text-cyan transition-colors"
    : "flex items-center gap-2 text-primaryDark/70 dark:text-gray-400 hover:text-primary dark:hover:text-cyan transition-colors";

  const iconClasses = compact ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Telegram */}
      <a
        href="https://t.me/gaaaalileo"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        <FaTelegram className={`${iconClasses} text-[#0088cc] mt-1  `} />
        {showLabels && <span>Telegram</span>}
        {!showLabels && !compact && <span>@gaaaalileo</span>}
      </a>

      {/* Email */}
      <a href="mailto:contact@gaurav.one" className={linkClasses}>
        <HiMail className={`${iconClasses} text-primary scale-125`} />
        {showLabels && <span>Email</span>}
        {!showLabels && !compact && <span>contact@gaurav.one</span>}
      </a>
    </div>
  );
}
