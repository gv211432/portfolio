"use client";

import React from "react";
import Link from "next/link";

interface ActionButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** URL to navigate to */
  href: string;
  /** Additional className */
  className?: string;
  /** Use Next.js Link for internal navigation */
  asLink?: boolean;
  /** Target attribute for external links */
  target?: string;
  /** Rel attribute for external links */
  rel?: string;
}

/**
 * PrimaryActionButton - Border style button with primary color
 * Used for secondary actions like "View Portfolio"
 */
export function PrimaryActionButton({
  children,
  href,
  className = "",
  asLink = false,
  target,
  rel,
}: ActionButtonProps) {
  const buttonClasses = `border-2 border-primary/50 text-primary hover:bg-primary/10 px-8 py-4 rounded-lg font-semibold transition-all inline-flex items-center justify-center ${className}`;

  if (asLink) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={buttonClasses} target={target} rel={rel}>
      {children}
    </a>
  );
}

/**
 * DarkActionButton - Gradient button from primary to primaryDark
 * Used for primary actions like "Get Estimate"
 */
export function DarkActionButton({
  children,
  href,
  className = "",
  asLink = false,
  target,
  rel,
}: ActionButtonProps) {
  const buttonClasses = `bg-gradient-to-r from-primary to-primaryDark hover:from-primaryDark hover:to-primary text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/20 inline-flex items-center justify-center ${className}`;

  if (asLink) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={buttonClasses} target={target} rel={rel}>
      {children}
    </a>
  );
}

/**
 * FloroActionButton - Cyan gradient button (fluorescent style)
 * Used for prominent CTAs like "Explore Services"
 */
export function FloroActionButton({
  children,
  href,
  className = "",
  asLink = false,
  target,
  rel,
}: ActionButtonProps) {
  const buttonClasses = `bg-gradient-to-r from-cyan to-cyan-600 hover:from-cyan-600 hover:to-cyan text-obsidian px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-xl hover:shadow-cyan/20 inline-flex items-center justify-center ${className}`;

  if (asLink) {
    return (
      <Link href={href} className={buttonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={buttonClasses} target={target} rel={rel}>
      {children}
    </a>
  );
}
