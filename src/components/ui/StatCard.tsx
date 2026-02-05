"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  value: string | number;
  label: string;
  index?: number;
  icon?: React.ReactNode;
  variant?: "default" | "gradient" | "outline";
}

/**
 * StatCard - Reusable stat/metric display card
 * Used in careers, opensource, whitelabel, and ngo pages
 */
export default function StatCard({
  value,
  label,
  index = 0,
  icon,
  variant = "default",
}: StatCardProps) {
  const variants = {
    default: "bg-light dark:bg-obsidian-50 border border-primary/20",
    gradient: "bg-gradient-to-br from-cyan/10 to-primary/10 border border-cyan/20",
    outline: "bg-transparent border-2 border-primary/30 dark:border-gray-700",
  };

  return (
    <motion.div
      className={`text-center p-6 rounded-2xl ${variants[variant]}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      {icon && (
        <div className="flex justify-center mb-3 text-cyan">
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold text-cyan mb-1">{value}</div>
      <div className="text-sm text-primaryDark/60 dark:text-gray-400">{label}</div>
    </motion.div>
  );
}
