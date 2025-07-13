"use client";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

const serviceSteps = ["5", "4", "3", "2", "1"];

export default function SnakeLadderIntro() {
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Animate climbing steps
  useEffect(() => {
    if (stepIndex >= serviceSteps.length) {
      // Show final message, then fade out
      setTimeout(() => setFadeOut(true), 2000);
      return;
    }

    const timeout = setTimeout(() => {
      setStepIndex((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [stepIndex]);

  // Get snake position relative to wrapper
  const getSnakeOffset = () => {
    const wrapperTop = wrapperRef.current?.getBoundingClientRect().top || 0;
    const target = stepRefs.current[stepIndex];
    if (!target) return 0;
    const rect = target.getBoundingClientRect();
    return rect.top - wrapperTop + rect.height / 2;
  };

  const snakeOffset = getSnakeOffset();

  return (
    <div
      ref={wrapperRef}
      className={classNames(
        "fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex items-center justify-center transition-opacity duration-1000",
        { "opacity-0 pointer-events-none": fadeOut }
      )}
    >
      <div className="relative flex flex-col items-center gap-6 h-[80vh] w-fit px-8">
        {/* Service numbers */}
        <div className="flex flex-col justify-between h-full text-4xl font-bold text-slate-400 dark:text-slate-600">
          {serviceSteps.map((label, i) => (
            <div
              key={label}
              ref={(el) => (stepRefs.current[i] = el)}
              className={classNames("transition-all", {
                "text-primary scale-125": i === stepIndex,
              })}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Snake dot */}
        <div
          className="absolute left-[-1.5rem] w-4 h-4 bg-primary rounded-full transition-transform duration-500"
          style={{
            transform: `translateY(${snakeOffset}px)`,
          }}
        />

        {/* Final message */}
        {stepIndex >= serviceSteps.length && (
          <div className="absolute bottom-[-4rem] text-center text-xl font-semibold text-primaryDark opacity-0 animate-fade-in">
            #1 Service by Gaurav.one
          </div>
        )}
      </div>
    </div>
  );
}
