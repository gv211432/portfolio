"use client";
import React from 'react';
import PortfolioSections from './Graphics';
import Typewriter from "typewriter-effect";
import Footer from '../Footer';

export default function RightScrollSection({
  rightSectionRef,
}: {
  rightSectionRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={rightSectionRef}
      className=" bg-white dark:bg-slate-950 overflow-y-auto w-full md:px-20 lg:px-0">
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
                  .pauseFor(3000)
                  .typeString("Welcome")
                  .pauseFor(2000)
                  .deleteChars(7)
                  .typeString(
                    "I am the <strong class='dark:text-primary text-primaryDark'>One</strong> you are looking for"
                  )
                  .pauseFor(2000)
                  .deleteChars(27)
                  .typeString(
                    "<strong>Gaurav</strong> from <span style='color:#444A6E'>Mumbai</span>"
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
                  .pauseFor(5000)
                  .start();
              }}
              options={{
                autoStart: true,
                loop: true,
                delay: 50,
                cursor: "|",
                deleteSpeed: 20,
              }}
            />
          </div>
        </center>
      </div>

      <PortfolioSections />

      {/* Footer */}
      <Footer />
    </div>
  );
}
