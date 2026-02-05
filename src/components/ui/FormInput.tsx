"use client";

import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  variant?: "default" | "careers" | "ngo";
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  variant?: "default" | "careers" | "ngo";
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  variant?: "default" | "careers" | "ngo";
}

const variantStyles = {
  default: {
    input: "bg-white dark:bg-obsidian-50/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan/50 focus:ring-cyan/30",
    label: "text-gray-600 dark:text-gray-300",
  },
  careers: {
    input: "bg-white dark:bg-obsidian-50/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan/50 focus:ring-cyan/30",
    label: "text-gray-600 dark:text-gray-300",
  },
  ngo: {
    input: "bg-gray-50 dark:bg-[#0A3622] border-[#198754]/30 text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-[#20c997]",
    label: "text-[#0F5132] dark:text-gray-300",
  },
};

/**
 * FormInput - Reusable form input component
 * Used in careers/jobs and ngo pages
 */
export function FormInput({
  label,
  error,
  hint,
  required,
  variant = "default",
  className = "",
  ...props
}: FormInputProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className}>
      <label className={`block text-sm font-medium ${styles.label} mb-2`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${styles.input}`}
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

/**
 * FormSelect - Reusable form select component
 */
export function FormSelect({
  label,
  options,
  error,
  required,
  variant = "default",
  className = "",
  ...props
}: FormSelectProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className}>
      <label className={`block text-sm font-medium ${styles.label} mb-2`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        {...props}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${styles.input}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

/**
 * FormTextarea - Reusable form textarea component
 */
export function FormTextarea({
  label,
  error,
  required,
  variant = "default",
  className = "",
  ...props
}: FormTextareaProps) {
  const styles = variantStyles[variant];

  return (
    <div className={className}>
      <label className={`block text-sm font-medium ${styles.label} mb-2`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        {...props}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors resize-none ${styles.input}`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default FormInput;
