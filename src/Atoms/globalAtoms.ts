import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DarkModeState {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  initializeDarkMode: () => void;
}

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      setDarkMode: (value) => {
        set({ darkMode: value });
        // Update document class
        if (typeof window !== "undefined") {
          if (value) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
      toggleDarkMode: () => {
        const newValue = !get().darkMode;
        set({ darkMode: newValue });
        // Update document class
        if (typeof window !== "undefined") {
          if (newValue) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
      initializeDarkMode: () => {
        const { darkMode } = get();
        if (typeof window !== "undefined") {
          if (darkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }),
    {
      name: "dark-mode-storage",
    }
  )
);
