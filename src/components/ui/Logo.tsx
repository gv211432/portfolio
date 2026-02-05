"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { domainUrls } from "@/config/global";

// Logo images for light/dark modes
import logoLight from "@/assets/brand/light-gaurav.one.webp";
import logoDark from "@/assets/brand/dark-gaurav.one.webp";

interface LogoProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether the logo is a link */
  asLink?: boolean;
  /** Custom href (defaults to domainUrls.root) */
  href?: string;
  /** Additional className for the wrapper */
  className?: string;
}

const sizeConfig = {
  sm: {
    text: "text-lg font-bold",
    image: 28,
  },
  md: {
    text: "text-xl font-bold",
    image: 32,
  },
  lg: {
    text: "text-2xl font-bold",
    image: 110,
  },
};

/**
 * Logo - Shared logo component for headers and footers
 * Displays logo image + "aurav.one" text
 * Uses different logo images for light/dark modes
 */
export default function Logo({
  size = "md",
  asLink = true,
  href,
  className = "",
}: LogoProps) {
  const config = sizeConfig[size];
  const linkHref = href || domainUrls.root;

  const LogoContent = () => (
    <div className={`flex items-center scale-125 ${className}`}>
      {/* Light mode logo */}
      <Image
        src={logoLight}
        alt="Gaurav.one"
        width={config.image}
        // height={config.image}
        className="dark:hidden rounded-lg mr-2"
      />
      {/* Dark mode logo */}
      <Image
        src={logoDark}
        alt="Gaurav.one"
        width={config.image}
        // height={config.image}
        className="hidden dark:block"
      />
      {/* <span className={`${config.text} text-primaryDark dark:text-white`}>
        Gaurav<span className="text-primary">.one</span>
      </span> */}
    </div>
  );

  if (asLink) {
    return (
      <Link href={linkHref} className="flex items-center ">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
