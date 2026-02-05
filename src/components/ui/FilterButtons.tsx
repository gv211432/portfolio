"use client";

import React from "react";

interface FilterOption<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface FilterButtonsProps<T extends string> {
  options: FilterOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * FilterButtons - Reusable filter/category button group
 * Used in careers, opensource, and whitelabel pages
 */
export default function FilterButtons<T extends string>({
  options,
  selected,
  onChange,
  className = "",
  size = "md",
}: FilterButtonsProps<T>) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={`${sizeClasses[size]} rounded-lg font-medium transition-all ${
            selected === option.key
              ? "bg-cyan text-obsidian"
              : "bg-light dark:bg-obsidian-50 border border-primary/20 text-primaryDark/70 dark:text-gray-400 hover:border-cyan/50"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ml-1.5 opacity-70">({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
