import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { cookieStorage } from "@/utils/cookies";

interface ChatOpenState {
  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;
}

export const useChatOpenStore = create<ChatOpenState>()((set) => ({
  isChatOpen: false,
  setIsChatOpen: (value) => set((state) => (state.isChatOpen === value ? state : { isChatOpen: value })),
}));

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
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
