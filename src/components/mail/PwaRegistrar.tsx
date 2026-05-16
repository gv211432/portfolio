"use client";
import { useEffect } from "react";

export default function PwaRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/mail-sw.js", { scope: "/" })
        .catch(() => {});
    }
  }, []);

  return null;
}
