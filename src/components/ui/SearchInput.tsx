"use client";

import React from "react";
import { TbFilter } from "react-icons/tb";
import { FaSearch } from "react-icons/fa";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: "search" | "filter";
}

/**
 * SearchInput - Reusable search input with icon
 * Used in opensource and whitelabel pages
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  icon = "filter",
}: SearchInputProps) {
  const IconComponent = icon === "search" ? FaSearch : TbFilter;

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 pl-10 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-xl text-primaryDark dark:text-white placeholder-primaryDark/40 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 transition-colors"
      />
      <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primaryDark/40 dark:text-gray-500" />
    </div>
  );
}
