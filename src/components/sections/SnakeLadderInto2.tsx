"use client";
import { useEffect, useRef, useState } from "react";
import SuccessLadder from "./SuccessLadder";
import gau2 from "@/assets/img/gaurav_2.png";
import Image from "next/image";

const steps = [

  { label: "User-friendly" },
  { label: "Cost-effective" },
  { label: "Innovative" },
  { label: "Flexible" },
  { label: "Accessible" },
  { label: "Compliant" },
  { label: "Supportive" },
  { label: "Customizable" },
  { label: "Robust" },
  { label: "Future-proof" },
  { label: "Performance-driven" },
];

export default function SnakeLadderIntro2() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setVisible(false);
    }, 2000);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={wrapper}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950 text-center transition-opacity duration-1000"
    >
      <div className="relative flex items-center justify-center w-[70rem] h-[18rem] pt-10  overflow-hidden">

        {/* Gradient blur overlays */}
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

        {/* <div className="absolute -rotate-90 top-[6rem] -left-[8rem] w-full h-16 bg-gradient-to-b from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" /> */}

        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

        {/* <Image
          height={65}
          width={65}
          src={gau2}
          alt="Gaurav's Image"
          className="absolute origin-top-left top-[1rem] translate-x-[7rem]  rounded-full shadow-lg z-20"
          style={{ transform: "translateY(-50%)" }}
        /> */}

        <div
          className={`absolute block origin-top-left -right-[56rem] md:-right-[28rem]  lg:-right-[32rem] animate-block `}
        >
          <ul className={`flex flex-col gap-6 animate-fade-in`}>
            {[...steps, ...steps].map((step, index) => (
              <li
                key={index}
                className={`-rotate-45  text-gray-800
                   dark:text-white text-sm font-medium py-7 px-4`}
              >
                {step.label}
              </li>
            ))}
          </ul>
        </div>

        <SuccessLadder />
      </div>
    </div >
  );
}
