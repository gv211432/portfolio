import { atom, useAtom } from "jotai";

const dark_mode = atom<Boolean>(false);
export const darkModeAtom = atom(
  (get) => get(dark_mode),
  (get, set, value) => {
    set(dark_mode, !get(dark_mode));
  }
);