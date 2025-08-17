"use client"; // Required for Next.js App Router
import { useState, useEffect } from 'react';

export const useTailwindMediaQuery = (breakpoint: keyof typeof defaultBreakpoints) => {
  const defaultBreakpoints = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
  };

  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(defaultBreakpoints[breakpoint]);
      setMatches(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [breakpoint]);

  return matches;
};