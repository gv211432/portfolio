"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface FeaturedCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

/**
 * FeaturedCarousel - Reusable carousel/slider component
 * Used in opensource and whitelabel pages for featured items
 */
export default function FeaturedCarousel<T>({
  items,
  renderItem,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = "",
}: FeaturedCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, autoPlayInterval, items.length]);

  if (items.length === 0) return null;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderItem(items[currentIndex], currentIndex)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-light/80 dark:bg-obsidian/80 border border-primary/20 flex items-center justify-center text-primaryDark dark:text-white hover:border-cyan/50 hover:text-cyan transition-all z-10"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-light/80 dark:bg-obsidian/80 border border-primary/20 flex items-center justify-center text-primaryDark dark:text-white hover:border-cyan/50 hover:text-cyan transition-all z-10"
            aria-label="Next slide"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-cyan w-6"
                  : "bg-primary/30 dark:bg-gray-600 hover:bg-cyan/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
