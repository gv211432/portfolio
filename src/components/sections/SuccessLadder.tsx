import React, { useEffect, useRef } from 'react';
import steps from '@/assets/json/steps.json';

import { useTheme } from "next-themes"; // for dark/light theming (optional)
import Lottie from "lottie-react";

export default function SuccessLadder() {
  const { theme } = useTheme(); // optional: for theming
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.setSpeed(0.7); // ✅ 0.5x speed (slower), 2 = 2x speed
    }
  }, []);

  return (
    <div className="w-64 h-64">
      <Lottie
        className=" scale-150"
        animationData={steps}
        loop
        autoplay
        lottieRef={animationRef} // 👈 attach ref here
      // style={{ width: '100%', height: '100%' }}
      // rendererSettings={{
      //   preserveAspectRatio: 'xMidYMid slice',
      //   className: theme === 'dark' ? 'dark-mode' : 'light-mode', // optional: for theming
      // }}
      />
    </div>
  );
}
