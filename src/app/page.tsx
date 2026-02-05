"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { domainUrls, globalConfig } from "@/config/global";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import {
  Logo,
  PrimaryActionButton,
  DarkActionButton,
  FloroActionButton,
  ContactDetails,
} from "@/components/ui";

// Terminal typewriter lines for hero section
const terminalLines = [
  { text: "Initializing gaurav.one...", delay: 0 },
  { text: "Status: Building Cross-Chain DEX...", delay: 1500 },
  { text: "Current Project: Qatari Riyal Stablecoin...", delay: 3000 },
  { text: "Expertise: Solana | Sui | Ethereum | Web3", delay: 4500 },
  { text: "Ready to build your next big thing_", delay: 6000 },
];

// Main nav links (visible in header)
const mainNavLinks = [
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Blogs", href: domainUrls.blogs, external: true },
];

// Dropdown links (More menu)
const dropdownLinks = [
  { name: "Open Source", href: domainUrls.opensource, external: true },
  { name: "Whitelabel Products", href: domainUrls.whitelabel, external: true },
  { name: "Case Study", href: domainUrls.casestudy, external: true },
  { name: "Careers", href: domainUrls.careers, external: true },
  { name: "NGO", href: domainUrls.ngo, external: false },
  { name: "Estimate", href: "#calculator" },
];

// All nav links for mobile menu
const navLinks = [
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Blogs", href: domainUrls.blogs, external: true },
  { name: "Open Source", href: domainUrls.opensource, external: true },
  { name: "Whitelabel", href: domainUrls.whitelabel, external: true },
  { name: "Case Study", href: domainUrls.casestudy, external: true },
  { name: "Careers", href: domainUrls.careers, external: true },
  { name: "NGO", href: domainUrls.ngo, external: false },
  { name: "Estimate", href: "#calculator" },
];

// Custom SVG Icons for services
const ServiceIcons = {
  smartContract: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <rect x="8" y="8" width="48" height="48" rx="4" strokeWidth="2" className="stroke-primary" />
      <path d="M20 24h24M20 32h24M20 40h16" strokeWidth="2" strokeLinecap="round" className="stroke-cyan" />
      <circle cx="48" cy="40" r="4" strokeWidth="2" className="stroke-primary fill-primary/20" />
    </svg>
  ),
  crossChain: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <circle cx="16" cy="32" r="10" strokeWidth="2" className="stroke-cyan" />
      <circle cx="48" cy="32" r="10" strokeWidth="2" className="stroke-primary" />
      <path d="M26 32h12" strokeWidth="2" strokeDasharray="4 2" className="stroke-primary" />
      <path d="M30 28l4 4-4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-cyan" />
    </svg>
  ),
  liquidity: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <path d="M32 8v48" strokeWidth="2" className="stroke-primary/50" />
      <path d="M8 32h48" strokeWidth="2" className="stroke-primary/50" />
      <path d="M16 48L32 16l16 32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-cyan" />
      <circle cx="32" cy="32" r="6" strokeWidth="2" className="stroke-primary fill-primary/20" />
    </svg>
  ),
  defi: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <polygon points="32,8 56,24 56,48 32,56 8,48 8,24" strokeWidth="2" className="stroke-cyan" />
      <polygon points="32,16 48,28 48,44 32,48 16,44 16,28" strokeWidth="2" className="stroke-primary fill-primary/10" />
      <circle cx="32" cy="36" r="4" className="fill-cyan" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <rect x="12" y="8" width="40" height="48" rx="2" strokeWidth="2" className="stroke-primary" />
      <path d="M20 20h24M20 28h24M20 36h16" strokeWidth="2" strokeLinecap="round" className="stroke-cyan/60" />
      <circle cx="44" cy="44" r="8" strokeWidth="2" className="stroke-cyan" />
      <path d="M50 50l6 6" strokeWidth="2" strokeLinecap="round" className="stroke-primary" />
    </svg>
  ),
  consulting: (
    <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor">
      <circle cx="32" cy="20" r="12" strokeWidth="2" className="stroke-primary" />
      <path d="M12 56c0-11 9-20 20-20s20 9 20 20" strokeWidth="2" className="stroke-cyan" />
      <path d="M32 8v4M44 20h4M20 20h-4M32 28v4" strokeWidth="2" strokeLinecap="round" className="stroke-primary/60" />
    </svg>
  ),
};

const services = [
  {
    icon: ServiceIcons.smartContract,
    title: "Smart Contract Development",
    description: "Secure, gas-optimized smart contracts on Solana, Sui, and EVM chains with comprehensive testing.",
  },
  {
    icon: ServiceIcons.crossChain,
    title: "Cross-Chain Bridging",
    description: "Seamless asset transfers between Solana, Sui, and Ethereum ecosystems with atomic swaps.",
  },
  {
    icon: ServiceIcons.liquidity,
    title: "DEX & Liquidity Aggregation",
    description: "Custom AMM designs and liquidity aggregators for optimal trade execution and minimal slippage.",
  },
  {
    icon: ServiceIcons.defi,
    title: "DeFi Protocol Development",
    description: "Lending protocols, yield optimizers, and staking mechanisms built for scale and security.",
  },
  {
    icon: ServiceIcons.audit,
    title: "Smart Contract Auditing",
    description: "Comprehensive security audits with formal verification and penetration testing.",
  },
  {
    icon: ServiceIcons.consulting,
    title: "CTO-as-a-Service",
    description: "Strategic technical leadership for blockchain startups, from architecture to launch.",
  },
];

const stats = [
  { number: "$50M+", label: "TVL Secured" },
  { number: "5+", label: "Years in Web3" },
  { number: "30+", label: "Protocols Built" },
  { number: "99.9%", label: "Uptime SLA" },
];

// Cross-Chain Visualizer Component
const CrossChainVisualizer = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { darkMode } = useDarkModeStore();

  return (
    <div
      className="relative w-full h-[300px] lg:h-[400px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background glow effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0.3,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-24 h-24 bg-cyan/20 rounded-full blur-2xl" />
        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      </motion.div>

      <svg viewBox="0 0 400 200" className="w-full h-full relative z-10">
        {/* Grid background - enhanced visibility */}
        <defs>
          <pattern id="crossChainGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={darkMode ? "rgba(139, 148, 203, 0.15)" : "rgba(107, 114, 155, 0.25)"}
              strokeWidth="0.5"
            />
          </pattern>
          <pattern id="crossChainGridDots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle
              cx="0"
              cy="0"
              r="1"
              fill={darkMode ? "rgba(0, 217, 255, 0.3)" : "rgba(0, 180, 220, 0.4)"}
            />
          </pattern>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="50%" stopColor={darkMode ? "#8b94cb" : "#6b729b"} />
            <stop offset="100%" stopColor="#8b94cb" />
          </linearGradient>
          <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={darkMode ? "#1a1a2e" : "#e8e8f0"} />
            <stop offset="100%" stopColor={darkMode ? "#0d0d0d" : "#d0d0e0"} />
          </linearGradient>
          <filter id="glowCyan">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowPrimary">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Grid background layers */}
        <rect width="400" height="200" fill="url(#crossChainGrid)" />
        <rect width="400" height="200" fill="url(#crossChainGridDots)" />

        {/* Curved connection paths - bottom arc */}
        <motion.path
          d="M 100 100 Q 200 160 300 100"
          stroke={darkMode ? "rgba(139, 148, 203, 0.2)" : "rgba(107, 114, 155, 0.3)"}
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: isHovered ? [0, 16] : 0 }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "linear" }}
        />

        {/* Main Connection Line - top arc */}
        <motion.path
          d="M 100 100 Q 200 40 300 100"
          stroke="url(#lineGradient)"
          strokeWidth={isHovered ? "3" : "2"}
          fill="none"
          strokeDasharray="8 4"
          filter="url(#glowCyan)"
          animate={{
            strokeDashoffset: isHovered ? [0, -24] : 0,
            strokeWidth: isHovered ? 3 : 2,
          }}
          transition={{ duration: 1, repeat: isHovered ? Infinity : 0, ease: "linear" }}
        />

        {/* Solana Node */}
        <g transform="translate(60, 100)">
          {/* Outer ring pulse */}
          <motion.circle
            r="42"
            fill="none"
            stroke="#00D9FF"
            strokeWidth="1"
            opacity={0.3}
            animate={{
              r: isHovered ? [42, 50, 42] : 42,
              opacity: isHovered ? [0.3, 0.1, 0.3] : 0.3,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Main circle */}
          <motion.circle
            r="35"
            fill={darkMode ? "rgba(0, 217, 255, 0.1)" : "rgba(0, 200, 240, 0.15)"}
            stroke="#00D9FF"
            strokeWidth="2"
            filter={isHovered ? "url(#glowCyan)" : undefined}
            animate={{
              scale: isHovered ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
          />
          {/* Inner glow */}
          <motion.circle
            r="25"
            fill="rgba(0, 217, 255, 0.05)"
            animate={{
              r: isHovered ? [25, 28, 25] : 25,
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <text
            y="5"
            textAnchor="middle"
            fill="#00D9FF"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="1"
          >
            SOLANA
          </text>
        </g>

        {/* Sui Node */}
        <g transform="translate(340, 100)">
          {/* Outer ring pulse */}
          <motion.circle
            r="42"
            fill="none"
            stroke="#8b94cb"
            strokeWidth="1"
            opacity={0.3}
            animate={{
              r: isHovered ? [42, 50, 42] : 42,
              opacity: isHovered ? [0.3, 0.1, 0.3] : 0.3,
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          {/* Main circle */}
          <motion.circle
            r="35"
            fill={darkMode ? "rgba(139, 148, 203, 0.1)" : "rgba(107, 114, 155, 0.15)"}
            stroke={darkMode ? "#8b94cb" : "#6b729b"}
            strokeWidth="2"
            filter={isHovered ? "url(#glowPrimary)" : undefined}
            animate={{
              scale: isHovered ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, delay: 0.3 }}
          />
          {/* Inner glow */}
          <motion.circle
            r="25"
            fill="rgba(139, 148, 203, 0.05)"
            animate={{
              r: isHovered ? [25, 28, 25] : 25,
            }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          />
          <text
            y="5"
            textAnchor="middle"
            fill={darkMode ? "#8b94cb" : "#6b729b"}
            fontSize="11"
            fontWeight="bold"
            letterSpacing="1"
          >
            SUI
          </text>
        </g>

        {/* Data Packets - following exact bezier curve paths */}
        <motion.g animate={{ opacity: isHovered ? 1 : 0.6 }}>
          {/* Cyan packet - Solana to Sui (top curve: Q 200 40) */}
          {/* Bezier points calculated: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2 */}
          <motion.circle
            r={isHovered ? "8" : "5"}
            fill="#00D9FF"
            filter="url(#glowCyan)"
            animate={{
              cx: [100, 125, 150, 175, 200, 225, 250, 275, 300],
              cy: [100, 87, 78, 72, 70, 72, 78, 87, 100],
            }}
            transition={{
              duration: isHovered ? 2 : 4,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
            }}
          />
          {/* Trail effect for cyan packet */}
          <motion.circle
            r="4"
            fill="#00D9FF"
            opacity={0.4}
            animate={{
              cx: [100, 125, 150, 175, 200, 225, 250, 275, 300],
              cy: [100, 87, 78, 72, 70, 72, 78, 87, 100],
            }}
            transition={{
              duration: isHovered ? 2 : 4,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              delay: 0.08,
            }}
          />

          {/* Purple packet - Sui to Solana (bottom curve: Q 200 160) */}
          <motion.circle
            r={isHovered ? "8" : "5"}
            fill="#8b94cb"
            filter="url(#glowPrimary)"
            animate={{
              cx: [300, 275, 250, 225, 200, 175, 150, 125, 100],
              cy: [100, 113, 123, 128, 130, 128, 123, 113, 100],
            }}
            transition={{
              duration: isHovered ? 2 : 4,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              delay: isHovered ? 1 : 2,
            }}
          />
          {/* Trail effect for purple packet */}
          <motion.circle
            r="4"
            fill="#8b94cb"
            opacity={0.4}
            animate={{
              cx: [300, 275, 250, 225, 200, 175, 150, 125, 100],
              cy: [100, 113, 123, 128, 130, 128, 123, 113, 100],
            }}
            transition={{
              duration: isHovered ? 2 : 4,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
              delay: isHovered ? 1.08 : 2.08,
            }}
          />
        </motion.g>

        {/* Center Bridge Icon */}
        <g transform="translate(200, 100)">
          {/* Bridge glow background */}
          <motion.ellipse
            cx="0"
            cy="0"
            rx="35"
            ry="25"
            fill={darkMode ? "rgba(0, 217, 255, 0.05)" : "rgba(0, 180, 220, 0.08)"}
            animate={{
              rx: isHovered ? [35, 40, 35] : 35,
              ry: isHovered ? [25, 30, 25] : 25,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Bridge box */}
          <motion.rect
            x="-28"
            y="-18"
            width="56"
            height="36"
            rx="6"
            fill="url(#bridgeGradient)"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            filter="url(#softShadow)"
            animate={{
              y: isHovered ? [-18, -22, -18] : -18,
              scale: isHovered ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Bridge icon - small connector lines */}
          <motion.g
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: 0.3 }}
          >
            <line x1="-18" y1="-5" x2="-10" y2="-5" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="-5" x2="18" y2="-5" stroke="#8b94cb" strokeWidth="2" strokeLinecap="round" />
            <motion.circle
              cx="0"
              cy="-5"
              r="3"
              fill={darkMode ? "#fff" : "#333"}
              animate={{
                scale: isHovered ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.g>
          {/* Bridge text */}
          <text
            y="10"
            textAnchor="middle"
            fill={darkMode ? "#ffffff" : "#1a1a2e"}
            fontSize="9"
            fontWeight="bold"
            letterSpacing="1.5"
          >
            BRIDGE
          </text>
        </g>

        {/* Decorative elements */}
        <motion.g opacity={isHovered ? 0.8 : 0.4}>
          {/* Small floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={i}
              r="2"
              fill={i % 2 === 0 ? "#00D9FF" : "#8b94cb"}
              animate={{
                cx: [100 + i * 40, 110 + i * 40, 100 + i * 40],
                cy: [30 + (i % 3) * 20, 25 + (i % 3) * 20, 30 + (i % 3) * 20],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.g>
      </svg>

      {/* Text container - single position to avoid overlap */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <AnimatePresence mode="wait">
          {!isHovered ? (
            <motion.div
              key="hover-hint"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0.6, 0.9, 0.6], y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{
                opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 0.15 },
              }}
              className="text-sm font-medium text-center"
            >
              <span className="text-cyan">Hover</span>
              <span className="text-primaryDark/60 dark:text-gray-400"> to see cross-chain data flow</span>
            </motion.div>
          ) : (
            <motion.div
              key="live-indicator"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
              <span className="text-cyan font-medium">Live Transfer</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Terminal Typewriter Component
const TerminalHero = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const typeText = useCallback((text: string, onComplete: () => void) => {
    let index = 0;
    setCurrentText("");
    const interval = setInterval(() => {
      if (index < text.length) {
        setCurrentText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentLineIndex < terminalLines.length) {
      const timer = setTimeout(() => {
        const cleanup = typeText(terminalLines[currentLineIndex].text, () => {
          setDisplayedLines((prev) => [...prev, terminalLines[currentLineIndex].text]);
          setCurrentText("");
          setCurrentLineIndex((prev) => prev + 1);
        });
        return cleanup;
      }, currentLineIndex === 0 ? 500 : 800);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      // Reset and loop
      const resetTimer = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIndex(0);
        setIsTyping(true);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentLineIndex, typeText]);

  return (
    <div className="bg-obsidian border border-primary/30 rounded-lg p-6 font-mono text-sm lg:text-base shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-primary/20">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-4 text-primary/60 text-xs">gaurav@blockchain:~</span>
      </div>

      {/* Terminal Content */}
      <div className="space-y-2 min-h-[200px]">
        {displayedLines.map((line, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-cyan">$</span>
            <span className="text-gray-300">{line}</span>
          </div>
        ))}
        {isTyping && currentLineIndex < terminalLines.length && (
          <div className="flex items-start gap-2">
            <span className="text-cyan">$</span>
            <span className="text-gray-300">
              {currentText}
              <span className="inline-block w-2 h-5 bg-primary ml-1 animate-blink" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Project Complexity Calculator
const ProjectCalculator = () => {
  const [features, setFeatures] = useState({
    multiChain: false,
    stablecoin: false,
    yieldOptimization: false,
    bridge: false,
    audit: false,
    ctoService: false,
  });

  const featureDetails = {
    multiChain: { label: "Multi-Chain Support", weeks: 4, complexity: "High" },
    stablecoin: { label: "Stablecoin Integration", weeks: 3, complexity: "Medium" },
    yieldOptimization: { label: "Yield Optimization", weeks: 5, complexity: "High" },
    bridge: { label: "Cross-Chain Bridge", weeks: 6, complexity: "Very High" },
    audit: { label: "Security Audit", weeks: 2, complexity: "Medium" },
    ctoService: { label: "CTO Advisory", weeks: 0, complexity: "Ongoing" },
  };

  const calculateEstimate = () => {
    let totalWeeks = 2; // Base development time
    let complexity = "Standard";

    Object.entries(features).forEach(([key, value]) => {
      if (value) {
        const detail = featureDetails[key as keyof typeof featureDetails];
        totalWeeks += detail.weeks;
        if (detail.complexity === "Very High") complexity = "Very High";
        else if (detail.complexity === "High" && complexity !== "Very High") complexity = "High";
      }
    });

    return { weeks: totalWeeks, complexity };
  };

  const estimate = calculateEstimate();
  const selectedCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="bg-light dark:bg-obsidian-50 border border-primary/30 rounded-2xl p-8 transition-colors duration-300">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-primaryDark dark:text-white mb-2">Project Complexity Calculator</h3>
        <p className="text-primaryDark/70 dark:text-gray-400">Toggle features to estimate your project scope</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {Object.entries(featureDetails).map(([key, detail]) => (
          <button
            key={key}
            onClick={() => setFeatures((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              features[key as keyof typeof features]
                ? "border-cyan bg-cyan/10"
                : "border-primary/30 hover:border-primary/60 bg-secondary dark:bg-obsidian"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${features[key as keyof typeof features] ? "text-cyan" : "text-primaryDark dark:text-white"}`}>
                {detail.label}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  detail.complexity === "Very High"
                    ? "bg-red-500/20 text-red-400"
                    : detail.complexity === "High"
                    ? "bg-orange-500/20 text-orange-400"
                    : detail.complexity === "Ongoing"
                    ? "bg-cyan/20 text-cyan"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {detail.complexity}
              </span>
            </div>
            <div className="text-sm text-primaryDark/60 dark:text-gray-400">
              {detail.weeks > 0 ? `+${detail.weeks} weeks` : "Monthly retainer"}
            </div>
          </button>
        ))}
      </div>

      {/* Estimate Display */}
      <div className="bg-secondary dark:bg-obsidian rounded-xl p-6 border border-primary/20 transition-colors duration-300">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-cyan">{estimate.weeks}</div>
            <div className="text-sm text-primaryDark/70 dark:text-gray-400">Estimated Weeks</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{selectedCount}</div>
            <div className="text-sm text-primaryDark/70 dark:text-gray-400">Features Selected</div>
          </div>
          <div>
            <div
              className={`text-3xl font-bold ${
                estimate.complexity === "Very High"
                  ? "text-red-400"
                  : estimate.complexity === "High"
                  ? "text-orange-400"
                  : "text-green-400"
              }`}
            >
              <span className="sm:hidden">{estimate.complexity === "Standard" ? "Std" : estimate.complexity}</span>
              <span className="hidden sm:inline">{estimate.complexity}</span>
            </div>
            <div className="text-sm text-primaryDark/70 dark:text-gray-400">Complexity</div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <DarkActionButton
          href={`mailto:${globalConfig.email}?subject=Project Inquiry - ${selectedCount} Features&body=Hi, I'm interested in a project with: ${Object.entries(features)
            .filter(([, v]) => v)
            .map(([k]) => featureDetails[k as keyof typeof featureDetails].label)
            .join(", ")}`}
          className="rounded-xl"
        >
          Get Detailed Quote
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </DarkActionButton>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode } = useDarkModeStore();

  // Toggle dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-secondary dark:bg-obsidian transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Logo size="lg" href="/" />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {mainNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium"
                >
                  {link.name}
                </a>
              ))}
              {/* More Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium">
                  More
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-white dark:bg-obsidian-50 rounded-xl shadow-xl border border-primary/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {dropdownLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="block px-4 py-2.5 text-primaryDark/70 dark:text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
                    >
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/contact"
                className="bg-gradient-to-r from-primary to-primaryDark hover:from-primaryDark hover:to-primary text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                Get Estimate
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden py-4 border-t border-primary/20"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="block py-3 text-gray-400 hover:text-primary transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="mt-4">
                  <Link
                    href="/contact"
                    className="block bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Estimate
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Hero Section with Terminal */}
      <section className="pt-32 lg:pt-32 pb-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-light to-secondary dark:from-obsidian dark:via-obsidian-50 dark:to-obsidian transition-colors duration-300" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan/10 dark:bg-cyan/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Web3 Development Studio
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-primaryDark dark:text-white leading-tight mb-6">
                Building the
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary font-cinzel font-black">
                  {" "}
                  Future{" "}
                </span>
                of Finance
              </h1>
              <p className="text-lg text-primaryDark/70 dark:text-gray-400 mb-8 max-w-xl">
                Expert blockchain development for cross-chain bridges, DEX aggregators, and DeFi protocols.
                From Solana to Sui, we architect solutions that scale.
              </p>
              <div className="flex flex-wrap gap-4">
                <FloroActionButton href="#services">
                  Explore Services
                </FloroActionButton>
                <PrimaryActionButton href={domainUrls.me}>
                  View Portfolio
                </PrimaryActionButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <TerminalHero />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 transition-colors duration-300">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-primaryDark/70 dark:text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Chain Visualizer Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold uppercase tracking-wider text-sm">Cross-Chain Expertise</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mt-4 mb-6">
                Bridging Blockchains,{" "}
                <span className="text-cyan">Unlocking Liquidity</span>
              </h2>
              <p className="text-primaryDark/70 dark:text-gray-400 mb-6 leading-relaxed">
                Specializing in Solana-Sui bridges and multi-chain DEX aggregators. We build the infrastructure
                that connects ecosystems and enables seamless asset transfers across chains.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Atomic Cross-Chain Swaps",
                  "Liquidity Aggregation Protocols",
                  "Multi-Chain Smart Contracts",
                  "Real-time Price Oracles",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-cyan/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-primaryDark/80 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <CrossChainVisualizer />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-light/50 dark:bg-obsidian-50/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider">Our Services</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mt-4">
              Blockchain Development Suite
            </h2>
            <p className="text-primaryDark/70 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
              End-to-end Web3 solutions from smart contracts to full protocol launches
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 bg-light dark:bg-obsidian rounded-2xl border border-primary/20 hover:border-cyan/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan/5"
              >
                <div className="mb-6 transition-transform group-hover:scale-110">{service.icon}</div>
                <h3 className="text-xl font-bold text-primaryDark dark:text-white mb-4 group-hover:text-cyan transition-colors">
                  {service.title}
                </h3>
                <p className="text-primaryDark/70 dark:text-gray-400 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Calculator Section */}
      <section id="calculator" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-cyan font-semibold uppercase tracking-wider">Project Estimator</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mt-4">
              Calculate Your Project Scope
            </h2>
            <p className="text-primaryDark/70 dark:text-gray-400 mt-4">
              Select features to get an instant complexity and timeline estimate
            </p>
          </div>

          <ProjectCalculator />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-cyan/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mb-6">
              Ready to Build the Next Big Protocol?
            </h2>
            <p className="text-primaryDark/70 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Let's discuss your project and create something that pushes the boundaries of DeFi.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <DarkActionButton href={`mailto:${globalConfig.email}`}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {globalConfig.email}
              </DarkActionButton>
              <PrimaryActionButton href={domainUrls.me} className="border-cyan text-cyan hover:bg-cyan/10">
                View Full Portfolio
              </PrimaryActionButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-light dark:bg-obsidian border-t border-primary/10 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="mb-6">
                <Logo size="lg" href="/" />
              </div>
              <p className="text-primaryDark/70 dark:text-gray-400 mb-6 max-w-md">
                Web3 development studio specializing in cross-chain infrastructure, DEX protocols, and DeFi solutions.
                Building the future of decentralized finance.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/gv211432"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/in/AstroX11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/formal_gaurav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
              {/* Contact Details */}
              {/* <ContactDetails variant="vertical" className="mt-6" /> */}
            </div>

            <div>
              <h4 className="text-primaryDark dark:text-white font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.slice(0, 5).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-primaryDark dark:text-white font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                {services.slice(0, 4).map((service) => (
                  <li key={service.title}>
                    <span className="text-primaryDark/70 dark:text-gray-400">{service.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-primary/10 mt-12 pt-8 text-center">
            <p className="text-primaryDark/70 dark:text-gray-400">
              © {new Date().getFullYear()} Gaurav.one. Building the decentralized future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
