import { create } from "zustand";

interface DarkModeState {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
}

export const useDarkModeStore = create<DarkModeState>((set) => ({
  darkMode: false,
  setDarkMode: (value) => set({ darkMode: value }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
