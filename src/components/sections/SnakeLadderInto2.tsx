"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const steps = [
  { label: "Timely response" },
  { label: "High security" },
  { label: "Modular" },
  { label: "Interactive" },
  { label: "# One Service" },
];

export default function SnakeLadderIntro2() {
  const wrapper = useRef<HTMLDivElement>(null);
  const ladder = useRef<HTMLDivElement>(null);
  const snake = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // @ts-ignore
  useEffect(() => {
    const ladderEl = ladder.current;
    const snakeEl = snake.current;
    if (!ladderEl || !snakeEl) return;

    const tl = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      onComplete: () => {
        setActiveStep(steps.length - 1);
        gsap.to(wrapper.current, { opacity: 0, delay: 1, duration: 1 });
        setTimeout(() => setVisible(false), 2200);
      },
    });

    steps.forEach((_, idx) => {
      tl.to(snakeEl, {
        y: `${(idx + 1) * -100}%`,
        duration: 1,
        onStart: () => setActiveStep(idx),
      });
    });

    return () => tl.kill();
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={wrapper}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950 text-center transition-opacity duration-1000"
    >
      <div className="relative w-64 h-96 overflow-hidden">
        {/* Infinite Ladder */}
        <div
          ref={ladder}
          className="absolute inset-0 flex flex-col items-center justify-center space-y-10"
          style={{ filter: "blur(20px)", opacity: 0.3 }}
        >
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="w-2 h-16 bg-gray-300 rounded-full" />
            ))}
        </div>

        {/* Visible Middle Ladder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-10">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={classNames(
                "w-48 p-2 rounded-lg transition-all duration-500",
                {
                  "bg-primary text-white scale-110 font-bold":
                    idx === activeStep,
                  "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400":
                    idx !== activeStep,
                }
              )}
            >
              <span className="text-xl">
                {idx < steps.length - 1 ? idx + 1 : <FontAwesomeIcon icon={faCheckCircle} />}
              </span>
              <p className="text-sm">{step.label}</p>
            </div>
          ))}
        </div>

        {/* Snake SVG */}
        <svg
          ref={snake}
          className="absolute left-8 w-8 h-8"
          viewBox="0 0 64 64"
        >
          <circle cx="32" cy="32" r="16" fill="#4CAF50" />
        </svg>
      </div>
    </div>
  );
}
