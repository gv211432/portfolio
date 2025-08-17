"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTailwindMediaQuery } from "@/hooks/useTailwindMediaQuery";

interface ExpandableSectionProps<T = any> {
  items: Array<T>;
  renderItem: (item: T, index: number) => React.ReactNode;
  initialVisibleCount?: number;
}

const ExpandableSection = <T,>({ items, renderItem, initialVisibleCount = 2 }: ExpandableSectionProps<T>) => {
  const isBigScreen = useTailwindMediaQuery('xl'); // Matches Tailwind's `md:`
  initialVisibleCount = isBigScreen ? 3 : 2;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreItems = items.length > initialVisibleCount;
  const visibleItems = isExpanded ? items : items.slice(0, initialVisibleCount);

  return (
    <>
      {visibleItems.map((item, index) => renderItem(item, index))}

      {hasMoreItems && (
        <div className="xl:col-span-3 sm:col-span-2 flex justify-center mt-4">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2 bg-[#444A6E] text-white rounded-lg hover:bg-[#333A5E] transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isExpanded ? 'Show Less' : `Show More (${items.length - initialVisibleCount} more)`}</span>
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </motion.button>
        </div>
      )}
    </>
  );
};

export default ExpandableSection;