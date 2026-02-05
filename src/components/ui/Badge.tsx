"use client";

import React from "react";

type BadgeVariant = "default" | "cyan" | "green" | "pink" | "amber" | "purple" | "blue" | "red" | "orange" | "indigo" | "emerald";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400",
  cyan: "bg-cyan/10 border-cyan/30 text-cyan",
  green: "bg-green-400/10 border-green-400/30 text-green-400",
  pink: "bg-pink-400/10 border-pink-400/30 text-pink-400",
  amber: "bg-amber-400/10 border-amber-400/30 text-amber-400",
  purple: "bg-purple-400/10 border-purple-400/30 text-purple-400",
  blue: "bg-blue-400/10 border-blue-400/30 text-blue-400",
  red: "bg-red-400/10 border-red-400/30 text-red-400",
  orange: "bg-orange-400/10 border-orange-400/30 text-orange-400",
  indigo: "bg-indigo-400/10 border-indigo-400/30 text-indigo-400",
  emerald: "bg-emerald-400/10 border-emerald-400/30 text-emerald-400",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

/**
 * Badge - Reusable badge/tag component
 * Used for category badges, status badges, type badges across all pages
 */
export default function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

// Helper to get variant from color string (for dynamic usage)
export const getVariantFromColor = (color: string): BadgeVariant => {
  if (color.includes("cyan")) return "cyan";
  if (color.includes("green")) return "green";
  if (color.includes("pink")) return "pink";
  if (color.includes("amber")) return "amber";
  if (color.includes("purple")) return "purple";
  if (color.includes("blue")) return "blue";
  if (color.includes("red")) return "red";
  if (color.includes("orange")) return "orange";
  if (color.includes("indigo")) return "indigo";
  if (color.includes("emerald")) return "emerald";
  return "default";
};
