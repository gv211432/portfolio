import React from 'react';
import { faSun, faBook } from "@fortawesome/free-solid-svg-icons";
import { faMoon } from "@fortawesome/free-regular-svg-icons";
import { motion } from "framer-motion";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function DarkModeToggleButton() {
  const { darkMode, toggleDarkMode } = useDarkModeStore();

  return (
    <div className="flex justify-center mt-2">
      <div className="flex relative justify-between bg-primary w-[3rem] h-[1.5rem] rounded-2xl items-center px-[0.3rem]">
        <motion.div
          // @ts-ignore
          className="absolute h-[1.2rem] w-[1.2rem] bg-primaryDark z-10 rounded-full cursor-pointer hover:scale-110"
          animate={{
            x: darkMode ? '1.35rem' : '0rem',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={toggleDarkMode}
        />
        {/* @ts-ignore */}
        <FontAwesomeIcon
          className="h-full scale-[0.7] cursor-pointer"
          icon={faMoon}
        />
        {/* @ts-ignore */}
        <FontAwesomeIcon
          className="h-full scale-[0.7] cursor-pointer"
          icon={faSun}
        />
      </div>
    </div>
  );
}
