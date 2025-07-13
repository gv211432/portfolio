import React from "react";
import classNames from "classnames";

interface GlowAuraWrapperProps {
  children: React.ReactNode;
  className?: string;        // for custom wrapper styling
  glowColorFrom?: string;    // Tailwind class: from-...
  glowColorTo?: string;      // Tailwind class: to-...
  blurStrength?: string;     // Tailwind blur class, e.g., blur-md
  opacity?: string;          // Tailwind opacity class, e.g., opacity-50
  rounded?: string;          // Tailwind rounded class, e.g., rounded-xl
}

const GlowAuraWrapper: React.FC<GlowAuraWrapperProps> = ({
  children,
  className = "",
  glowColorFrom = "from-primary",
  glowColorTo = "to-primaryDark",
  blurStrength = "blur-md",
  opacity = "opacity-50",
  rounded = "rounded-xl",
}) => {
  return (
    <div className={classNames("relative inline-block", className)}>
      {/* Aura Layer */}
      <div
        className={classNames(
          "absolute inset-0 z-0",
          `bg-gradient-to-r ${glowColorFrom} ${glowColorTo}`,
          blurStrength,
          opacity,
          rounded
        )}
      />
      {/* Foreground Content */}
      <div className={classNames("relative z-10", rounded)}>
        {children}
      </div>
    </div>
  );
};

export default GlowAuraWrapper;
