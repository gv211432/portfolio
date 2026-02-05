"use client";

import React from "react";
import { FaArrowRight } from "react-icons/fa";

interface CTASectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  variant?: "gradient" | "solid" | "outline";
  icon?: React.ReactNode;
  external?: boolean;
}

/**
 * CTASection - Reusable call-to-action section
 * Used in careers, opensource, whitelabel, and whitelabel/products pages
 */
export default function CTASection({
  title,
  description,
  ctaText,
  ctaLink,
  variant = "gradient",
  icon,
  external = false,
}: CTASectionProps) {
  const variants = {
    gradient: "bg-gradient-to-br from-cyan/10 to-primary/10 border border-cyan/20",
    solid: "bg-cyan/10 border border-cyan/30",
    outline: "bg-transparent border-2 border-cyan/30",
  };

  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${variants[variant]} rounded-3xl p-8 lg:p-12 text-center`}>
          {icon && (
            <div className="flex justify-center mb-4 text-cyan text-4xl">
              {icon}
            </div>
          )}
          <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-primaryDark/60 dark:text-gray-400 mb-6 max-w-xl mx-auto">
            {description}
          </p>
          <a
            href={ctaLink}
            {...linkProps}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-obsidian font-semibold rounded-xl hover:bg-cyan/90 transition-colors"
          >
            {ctaText}
            <FaArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
