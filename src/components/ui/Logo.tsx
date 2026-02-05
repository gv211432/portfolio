"use client";

import React from "react";
import Link from "next/link";
import { domainUrls } from "@/config/global";

interface LogoProps {
  /** Show the icon box with "G" before the text */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether the logo is a link */
  asLink?: boolean;
  /** Custom href (defaults to domainUrls.root) */
  href?: string;
  /** Additional className for the wrapper */
  className?: string;
}

const sizeConfig = {
  sm: {
    text: "text-lg font-bold",
    icon: "w-7 h-7 text-xs",
  },
  md: {
    text: "text-xl font-bold",
    icon: "w-8 h-8 text-sm",
  },
  lg: {
    text: "text-2xl font-bold",
    icon: "w-10 h-10 text-base",
  },
};

/**
 * Logo - Shared logo component for headers and footers
 * Displays "Gaurav.one" with optional icon box
 */
export default function Logo({
  showIcon = false,
  size = "md",
  asLink = true,
  href,
  className = "",
}: LogoProps) {
  const config = sizeConfig[size];
  const linkHref = href || domainUrls.root;

  const LogoContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div
          className={`${config.icon} rounded-lg bg-gradient-to-br from-cyan to-primary flex items-center justify-center`}
        >
          <span className="text-obsidian font-bold">G</span>
        </div>
      )}
      <span className={`${config.text} text-primaryDark dark:text-white`}>
        Gaurav<span className="text-primary">.one</span>
      </span>
    </div>
  );

  if (asLink) {
    return (
      <Link href={linkHref} className="flex items-center gap-2">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
