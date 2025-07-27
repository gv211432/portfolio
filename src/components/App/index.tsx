"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import LeftStickyBar from "../sections/LeftStickyBar";
import RightScrollSection from "../sections/ RightScrollSection";
import SnakeLadderIntro2 from "../sections/SnakeLadderInto2";


export default function App() {
  const rightSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Use a ref to avoid re-rendering too often
  const scrollAnimFrame = useRef<number>(null);

  const updateScrollProgress = () => {
    const container = rightSectionRef.current;
    const isMobile = window.innerWidth < 1024;

    let scrollTop, scrollHeight, clientHeight;

    if (isMobile) {
      scrollTop = window.scrollY;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      if (!container) return;
      scrollTop = container.scrollTop;
      scrollHeight = container.scrollHeight;
      clientHeight = container.clientHeight;
    }

    const docHeight = scrollHeight - clientHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    setScrollProgress(progress);
    setShowScrollToTop(scrollTop > 100);

    scrollAnimFrame.current = requestAnimationFrame(updateScrollProgress);
  };


  useEffect(() => {
    scrollAnimFrame.current = requestAnimationFrame(updateScrollProgress);
    return () => {
      if (scrollAnimFrame.current) cancelAnimationFrame(scrollAnimFrame.current);
    };
  }, []);

  const handleScrollToTop = () => {
    rightSectionRef?.current?.scrollTo({ top: 0, behavior: "smooth" });
    window?.scrollTo({ top: 0, behavior: "smooth" });
    setShowScrollToTop(false); // Hide the button after scrolling to top
  };

  return (
    <>
      {/* On pageload full screen animation */}
      <SnakeLadderIntro2 />

      {/* Star animation show */}
      {/* <div className="relative  bg-white">
        <div className="star-bg z-0">
          <div id='stars'></div>
          <div id='stars3'></div>
        </div>
      </div> */}

      <div className="relative h-full lg:overflow-hidden bg-transparent z-10">

        {/* Top scroll progress bar */}
        <div className="fixed top-0 left-0 w-full h-[0.6rem] z-[9999] bg-transparent pointer-events-none">
          {/* Blur aura layer */}
          <div
            className="absolute top-0 h-full rounded-r-full 
               w-full 
               bg-gradient-to-r from-primary to-primaryDark 
               blur-md opacity-50"
            style={{ width: `${scrollProgress}%` }}
          />

          {/* Foreground solid layer */}
          <div
            className="relative h-full rounded-r-full 
               bg-gradient-to-r from-primary to-primaryDark 
               shadow-[0_0_10px_rgba(100,116,255,0.8)] 
               transition-all duration-75 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div
          className="relative lg:flex min-h-[100vh] h-[97vh] lg:overflow-hidden
           text-slate-900 dark:bg-transparent bg-white py-3">

          <LeftStickyBar />

          <RightScrollSection rightSectionRef={rightSectionRef} />

          {showScrollToTop && (
            <button
              onClick={handleScrollToTop}
              className="fixed bottom-12 right-12 z-[9999] bg-primaryDark text-white p-3 w-[48px] 
              rounded-full shadow-lg hover:scale-105 transition"
              aria-label="Scroll to top"
            >
              {/* @ts-ignore */}
              <FontAwesomeIcon icon={faArrowUp} />
            </button>
          )}

        </div>

      </div>
    </>
  );
};
