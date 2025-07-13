import React from 'react';
import { faSun, faBook } from "@fortawesome/free-solid-svg-icons";
import { faMoon } from "@fortawesome/free-regular-svg-icons";
import { motion } from "framer-motion";
import { darkModeAtom } from "@/Atoms/globalAtoms";
import { atom, useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function DarkModeToggleButton() {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);

  return (
    <div className="flex justify-center mt-2">
      <div className="flex relative justify-between bg-primary w-[3rem] h-[1.5rem] rounded-2xl items-center px-[0.3rem]">
        <motion.div
          className="absolute h-[1.2rem] w-[1.2rem] bg-primaryDark z-10 rounded-full cursor-pointer hover:scale-110"
          animate={{
            x: darkMode ? '1.35rem' : '0rem',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setDarkMode(!darkMode)}
        />
        <FontAwesomeIcon
          className="h-full scale-[0.7] cursor-pointer"
          icon={faMoon}
        />
        <FontAwesomeIcon
          className="h-full scale-[0.7] cursor-pointer"
          icon={faSun}
        />
      </div>
    </div>
  );
}
