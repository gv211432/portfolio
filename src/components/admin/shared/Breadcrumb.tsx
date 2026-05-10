"use client";

import { Fragment } from "react";
import { BreadcrumbItem } from "@/Atoms/globalAtoms";

interface Props {
  items: BreadcrumbItem[];
  size?: "sm" | "xs";
}

export default function Breadcrumb({ items, size = "sm" }: Props) {
  if (!items.length) return null;

  const textSize = size === "xs" ? "text-xs" : "text-sm";

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1 ${textSize}`}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-gray-300 dark:text-slate-600 select-none" aria-hidden>›</span>
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline underline-offset-2 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-500 dark:text-slate-400 font-medium">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
