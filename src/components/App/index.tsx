"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import { atom, useAtom } from "jotai";

import gaurav_img from "../../assets/img/gaurav_sq_img.png";
import gaurav_logo_5 from "../../assets/img/gaurav_5.png";

import Typewriter from "typewriter-effect";
import { useState } from "react";
import { faSun } from "@fortawesome/free-solid-svg-icons";
import { faMoon } from "@fortawesome/free-regular-svg-icons";
import { darkModeAtom } from "@/Atoms/globalAtoms";

function Data() {
  return (
    <div className="block">
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quod enim beatae
      quos similique quibusdam recusandae aut voluptate deleniti ipsam esse,
      quasi id expedita, quo sapiente a doloribus officia odit. FSapiente! Lorem
      ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quo. Dolore
      ab nihil nemo nostrum repellat minima laudantium, numquam quod, voluptatem
      quae eius natus soluta tempore facere id aliquam? Doloremque.
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  );
}

export default function App() {
  const [showPlace, setShowPlace] = useState(false);
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);

  return (
    <div
      className="lg:flex min-h-[100vh] h-[97vh] lg:overflow-hidden
    dark:bg-slate-950 text-slate-900 bg-white
    "
    >
      {/* left side bar */}
      {/* Biometrics + Others info */}
      <div
        className="bg-white h-[98vh] lg:w-[35rem] border-[1px] border-gray-400
        m-2 mx-4 rounded-2xl relative  max-[250px]:hidden
        dark:bg-slate-950 dark:border-slate-400 dark:text-slate-200
        "
      >
        <br />
        <motion.div
          className=""
          animate={{
            opacity: showPlace ? [1, 0.2] : [0, 1],
          }}
        >
          <div className="flex justify-between">
            <span
              className={`ml-2 flex font-bold text-[2.3rem] text-gray-600 dark:text-slate-100`}
            >
              <motion.img
                className="h-[2.9rem] rounded-full ml-1 m-2 mr-0 grayscale"
                src={gaurav_logo_5.src}
                alt="gaurav"
              />
              aurav
              <span className=" invisible">gaurav</span>
            </span>
            <span
              className={`mr-2 font-bold my-auto text-[1rem] text-gray-500 
              max-[364px]:hidden dark:text-slate-100`}
            >
              Full Stack Developer
            </span>
          </div>
          <div className="flex justify-between h-[40vh]">
            <motion.img
              animate={{
                scale: [0.8, 1],
              }}
              transition={{
                type: "spring",
                duration: 1,
              }}
              src={gaurav_img.src}
              alt="Gaurav Vishwakarma"
              className={`h-[14rem] rounded-3xl mx-auto my-auto`}
            />
          </div>
          <div
            className="text-center max-[450px]:text-[1.3rem] text-[1.8rem] p-1 max-[345px]:text-sm
            font-light
          "
          >
            <span className="">
              hi@gaurav<span className="text-[#8b94cb]">vishwakarma</span>.com
            </span>
            <br />
            Based in Mumbai, India
          </div>
          <div className="text-center text-[1rem]">
            © 2023 Gaurav. All Rights Reserved
          </div>

          <motion.div className="flex justify-center">
            <a href="https://www.linkedin.com/in/gaurav-vishwakarma-33469a225/">
              <FontAwesomeIcon
                height={30}
                className="m-2 h-8 text-gray-700 dark:text-white hover:scale-110 cursor-pointer"
                icon={faLinkedin}
              />
            </a>
            <a href="https://github.com/gv211432">
              <FontAwesomeIcon
                height={30}
                className="m-2 h-8 text-gray-700 dark:text-white hover:scale-110 cursor-pointer"
                icon={faGithub}
              />
            </a>
            <a href="https://twitter.com/formal_gaurav">
              <FontAwesomeIcon
                height={30}
                className="m-2 h-8 text-gray-700 dark:text-white hover:scale-110 cursor-pointer"
                icon={faTwitter}
              />
            </a>
            <a href="https://leetcode.com/v_gaurav/">
              <motion.img
                className="h-[2rem] rounded-full m-2 hover:scale-110 
              dark:border-0 border-[2px] border-gray-700  cursor-pointer grayscale"
                src="https://th.bing.com/th?id=OIP.jlFRTpn75iQt63ANsB7DTgHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2"
                alt="leetcode"
              />
            </a>
          </motion.div>

          <div className="flex justify-center mt-2">
            <div className="flex relative justify-between bg-[#8b94cb] bg-[#dfc061]x w-[3rem] h-[1.5rem] rounded-2xl">
              <motion.div
                className="absolute h-[1.3rem] w-[1.3rem] bg-slate-600 mt-[0.1rem] ml-[0.1rem] z-10 rounded-full
                  cursor-pointer hover:scale-110
                  "
                animate={{
                  left: darkMode ? ["0.1rem", "1.4rem"] : ["1.5rem", "0.1rem"],
                }}
                onClick={() => {
                  setDarkMode(false);
                }}
              ></motion.div>
              <FontAwesomeIcon
                height={10}
                className="ml-1 h-full scale-[0.7] cursor-pointer"
                icon={faMoon}
              />
              <FontAwesomeIcon
                height={10}
                className="h-full scale-[0.7] cursor-pointer mr-[1.2rem]"
                icon={faSun}
              />
            </div>
          </div>

          <center className="absolute w-full bottom-8 text-[1.5rem]">
            <a href="mailto:hi@gauravvishwakarma.com;gaurav.ram@gmail.com">
              <div
                className="border-[1px]  border-gray-500 mx-8 rounded-lg hover:bg-[#444A6E]
              hover:border-0 dark:hover:text-slate-950 cursor-pointer hover:text-slate-100
              "
              >
                Hire Me
              </div>
            </a>
          </center>
        </motion.div>
      </div>
      {/* Demographics */}
      <div
        className="bg-white lg:h-[100vh] lg:w-[100%]
         dark:bg-slate-950  dark:text-slate-200
          lg:overflow-y-auto"
      >
        {/* introduction */}
        <center className="lg:flex hidden justify-center h-[100vh] text-center bg-orange-400x">
          <div id="intro_space" className="my-auto text-[2.5rem] ">
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .pauseFor(2000)
                  .typeString("Welcome")
                  .pauseFor(2000)
                  .deleteChars(7)
                  .typeString(
                    "I am <strong>Gaurav</strong> from <span style='color:#444A6E'>Mumbai</span>"
                  )
                  .pauseFor(2000)
                  .deleteChars(18)
                  .typeString("a <strong>Full Stack Developer</strong>")
                  .pauseFor(2000)
                  .deleteChars(22)
                  .typeString("a <strong>Web3 Developer</strong>")
                  .pauseFor(2000)
                  .deleteChars(16)
                  // .typeString('<strong>JS</strong> plugin for a cool typewriter effect and ')
                  // .typeString('<strong>only <span style="color: #27ae60;">5kb</span> Gzipped!</strong>')
                  .pauseFor(1000)
                  .deleteAll()
                  .pasteString("HIRE ME", null)
                  .start();
              }}
            />
          </div>
        </center>
        {/* projects */}
        {/* <div className="h-[100vh] bg-sky-400">hi</div> */}
        {/* about */}
        {/* <div className="h-[100vh] bg-red-400">hi</div>
        <Data />
        <Data />
        <Data />
        <Data />
        <Data />
        <Data />
        <Data />
        <Data />
        <Data />
        <Data /> */}
      </div>
    </div>
  );
}
