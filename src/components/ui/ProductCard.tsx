"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  image?: string;
  gradient?: string;
  href: string;
  tags?: { label: string; color: string; bgColor: string }[];
  features?: string[];
  techStack?: string[];
  icon?: React.ReactNode;
  layout?: "grid" | "list";
  index?: number;
  external?: boolean;
}

/**
 * ProductCard - Reusable product/project card
 * Used in opensource, whitelabel, and whitelabel/products pages
 */
export default function ProductCard({
  id,
  name,
  description,
  image,
  gradient = "from-cyan-500 to-blue-600",
  href,
  tags = [],
  features = [],
  techStack = [],
  icon,
  layout = "grid",
  index = 0,
  external = false,
}: ProductCardProps) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  if (layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Link href={href} {...linkProps}>
          <div className="group flex flex-col md:flex-row bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10">
            {/* Image */}
            <div className="md:w-72 lg:w-80 flex-shrink-0">
              <div className={`h-48 md:h-full bg-gradient-to-br ${gradient} relative`}>
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    {icon || <div className="w-16 h-16 rounded-xl bg-white/10" />}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded-full text-xs border ${tag.bgColor} ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors">
                    {name}
                  </h3>
                </div>
                <FaArrowRight className="w-5 h-5 text-primaryDark/30 dark:text-gray-600 group-hover:text-cyan group-hover:translate-x-1 transition-all" />
              </div>

              <p className="text-primaryDark/70 dark:text-gray-400 mb-4 line-clamp-2">
                {description}
              </p>

              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {techStack.slice(0, 5).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-primary/5 dark:bg-gray-800 rounded text-xs text-primaryDark/60 dark:text-gray-500"
                    >
                      {tech}
                    </span>
                  ))}
                  {techStack.length > 5 && (
                    <span className="px-2 py-0.5 text-xs text-primaryDark/40 dark:text-gray-600">
                      +{techStack.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={href} {...linkProps}>
        <div className="group h-full bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1">
          {/* Gradient header */}
          <div className={`h-2 bg-gradient-to-r ${gradient}`} />

          {/* Image */}
          {image && (
            <div className="relative h-40 bg-gradient-to-br from-primary/5 to-cyan/5">
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full text-xs border ${tag.bgColor} ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              {icon && (
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0`}>
                  {icon}
                </div>
              )}
              <div>
                <h3 className="font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors">
                  {name}
                </h3>
              </div>
            </div>

            <p className="text-sm text-primaryDark/70 dark:text-gray-400 mb-4 line-clamp-2">
              {description}
            </p>

            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {techStack.slice(0, 3).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-primary/5 dark:bg-gray-800 rounded text-xs text-primaryDark/60 dark:text-gray-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center text-cyan text-sm font-medium">
              {external ? (
                <>
                  View Project <FaExternalLinkAlt className="ml-2 w-3 h-3" />
                </>
              ) : (
                <>
                  Learn More <FaArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
