"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "gradient" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  delay?: number;
}

const variantStyles = {
  default: "bg-light dark:bg-obsidian-50 border border-primary/20",
  glass: "bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800",
  gradient: "bg-gradient-to-br from-cyan/5 to-primary/5 border border-cyan/20",
  outline: "bg-transparent border-2 border-primary/20 dark:border-gray-700",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Card - Reusable card component with animations
 * Used across all domain pages for content sections
 */
export default function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  delay = 0,
  className = "",
  ...motionProps
}: CardProps) {
  const hoverStyles = hover
    ? "hover:border-cyan/50 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1 transition-all duration-300"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

// Variant for whileInView animations
export function CardInView({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  delay = 0,
  className = "",
  ...motionProps
}: CardProps) {
  const hoverStyles = hover
    ? "hover:border-cyan/50 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1 transition-all duration-300"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
