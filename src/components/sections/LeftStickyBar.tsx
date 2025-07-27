"use client";
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import gaurav_img from "../../assets/img/gaurav_sq_img.webp";
import gaurav_logo_5 from "../../assets/img/gaurav_5.png";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import DarkModeToggleButton from "../inputs/DarkModeToggleButton";


export default function LeftStickyBar() {

  const skills = [
    "D3.js",
    "MongoDB",
    "Postgres",
    "Python",
    "FastAPI",
    "Prisma",
    "Node.js",
    "React.js",
    "Next.js",
    "Nest.js",
    "Solidity",
    "Rust Lang",
    "Express.js",
    "Solana",
    "Redhat Certified",
    "Google Certified Python Dev",
  ];

  return (
    <>
      {/* left side bar */}
      {/* Biometrics + Others info */}
      <div
        className="bg-white h-[98vh] lg:w-[35rem] border-[1px] border-gray-400
         mx-4 rounded-2xl relative  max-[250px]:hidden shadow-lg
        dark:bg-slate-950 dark:border-slate-400 dark:text-slate-200 md:mx-20 lg:mx-4 pb-12 lg:pb-0 -mb-8 ">

        <br />

        <div className="flex flex-col justify-between h-full">

          {/* Top section */}
          <div className="">
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
          </div>

          {/* Text Section */}
          <div className="">

            <div className="flex justify-between pb-4">
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
            font-light"
            >
              <span className="">
                hi@
                <span className="text-primary">gaurav</span>
                .one
              </span>
              <br />
              Based in Mumbai, India
            </div>

            <div className="text-center text-[1rem]">
              © 2025 Gaurav. All Rights Reserved
            </div>

            <motion.div className="flex justify-center">
              <a href="https://www.linkedin.com/in/vishwakarmagaurav/">
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
              <a href="https://blogs.gaurav.one">
                <FontAwesomeIcon
                  height={30}
                  className="m-2 h-8 text-gray-700 dark:text-white hover:scale-110 cursor-pointer"
                  icon={faBook}
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

            <DarkModeToggleButton />
          </div>

          {/* Skills Section */}
          <div className="relative  overflow-hidden h-[2rem] bg-gradient-to-r from-primaryGray to-slate-800">
            <div className="absolute  whitespace-nowrap animate-marquee text-white text-[0.9rem] font-semibold flex">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="mx-2 px-2 py-1 rounded-lg  transition-colors"
                >
                  <ul className="list-disc m-0 p-0 flex items-center justify-center">
                    <li>{skill}</li>
                  </ul>
                </span>
              ))}
              {/* Repeat to make loop seamless */}
              {skills.map((skill, index) => (
                <span
                  key={"loop-" + index}
                  className="mx-2 px-2 py-1 rounded-lg  transition-colors"
                >
                  <ul className="list-disc m-0 p-0 flex items-center justify-center">
                    <li>{skill}</li>
                  </ul>
                </span>
              ))}
            </div>
          </div>

          {/* Bottom/Hire Button Section */}
          <center className=" w-full pb-10 text-[1.5rem]">

            <a href="mailto:hi@gaurav.one;gaurav.ram@hotmail.com">
              <div
                className="border-[1px]  border-gray-500 mx-8 rounded-lg hover:bg-primaryGray
              hover:border-0 dark:hover:text-white cursor-pointer hover:text-slate-100
              "
              >
                Hire Me
              </div>
            </a>
          </center>

        </div>
      </div>
    </>
  );
}
