// Centralized icon mapping for consistent icon usage across the app
import React from "react";
import {
  FaCode,
  FaServer,
  FaShieldAlt,
  FaPaintBrush,
  FaReact,
  FaDatabase,
  FaFileContract,
  FaMobile,
  FaDesktop,
  FaCloud,
  FaMicrochip,
  FaCube,
  FaGamepad,
  FaChartLine,
  FaLock,
  FaRocket,
  FaCogs,
  FaPlug,
  FaGlobe,
  FaWallet,
} from "react-icons/fa";
import { GiCardAceSpades } from "react-icons/gi";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

// Icon components mapping
export const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  FaCode,
  FaServer,
  FaShieldAlt,
  FaPaintBrush,
  FaReact,
  FaDatabase,
  FaFileContract,
  FaMobile,
  FaDesktop,
  FaCloud,
  FaMicrochip,
  FaCube,
  FaGamepad,
  FaChartLine,
  FaLock,
  FaRocket,
  FaCogs,
  FaPlug,
  FaGlobe,
  FaWallet,
  GiCardAceSpades,
};

// Get icon component by name
export const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  return iconComponents[iconName] || FaCode;
};

// Get icon element with size
export const getIcon = (iconName: string, size: IconSize = "md", className?: string): React.ReactNode => {
  const IconComponent = getIconComponent(iconName);
  const sizeClass = sizeClasses[size];
  return <IconComponent className={`${sizeClass} ${className || ""}`} />;
};

// Create icon map with specific size (for backwards compatibility)
export const createIconMap = (size: IconSize = "lg"): Record<string, React.ReactNode> => {
  const sizeClass = sizeClasses[size];
  return Object.fromEntries(
    Object.entries(iconComponents).map(([name, Icon]) => [
      name,
      <Icon key={name} className={sizeClass} />,
    ])
  );
};

// Default icon maps for common use cases
export const iconMapLg = createIconMap("lg");
export const iconMapMd = createIconMap("md");
export const iconMapSm = createIconMap("sm");
