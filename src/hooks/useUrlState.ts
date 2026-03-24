"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Syncs a set of string key/value pairs with URL query params via
 * window.history.replaceState (no navigation, no re-render from router).
 *
 * - Initialised from defaults on SSR, then hydrated from URL on mount.
 * - Keys whose value equals the default are omitted from the URL.
 * - Keys with value "" are also omitted.
 */
export function useUrlState<T extends Record<string, string>>(
  defaults: T
): [T, (updates: Partial<T>) => void] {
  const defaultsRef = useRef(defaults);

  const readFromUrl = useCallback((): T => {
    if (typeof window === "undefined") return defaultsRef.current;
    const sp = new URLSearchParams(window.location.search);
    const result = { ...defaultsRef.current } as Record<string, string>;
    for (const key of Object.keys(defaultsRef.current)) {
      const val = sp.get(key);
      if (val !== null) result[key] = val;
    }
    return result as T;
  }, []);

  const [state, setState] = useState<T>(defaults);

  // Hydrate from URL after mount (avoids SSR mismatch)
  useEffect(() => {
    setState(readFromUrl());
  }, [readFromUrl]);

  const setParams = useCallback((updates: Partial<T>) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [key, val] of Object.entries(updates)) {
      const isDefault = val === undefined || val === "" || val === (defaultsRef.current as Record<string, string>)[key];
      if (isDefault) {
        sp.delete(key);
      } else {
        sp.set(key, val as string);
      }
    }
    const qs = sp.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
    setState((prev) => ({ ...prev, ...updates }) as T);
  }, []);

  return [state, setParams];
}
