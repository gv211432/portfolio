// Open Source Projects Data

export type ProjectType = "cli" | "library" | "website" | "mobile-app" | "desktop-app" | "api" | "firmware" | "dapp";

export interface OpenSourceProject {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  url: string;
  image?: string;
  techStack: string[];
  features: string[];
  stars?: number;
  downloads?: string;
  isNpm?: boolean;
  highlighted?: boolean;
}

export const projectTypeInfo: Record<ProjectType, { label: string; color: string; bgColor: string }> = {
  cli: {
    label: "CLI",
    color: "text-green-400",
    bgColor: "bg-green-400/10 border-green-400/30",
  },
  library: {
    label: "Library",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10 border-purple-400/30",
  },
  website: {
    label: "Website",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30",
  },
  "mobile-app": {
    label: "Mobile App",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/30",
  },
  "desktop-app": {
    label: "Desktop App",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/30",
  },
  api: {
    label: "API",
    color: "text-cyan",
    bgColor: "bg-cyan/10 border-cyan/30",
  },
  firmware: {
    label: "Firmware",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30",
  },
  dapp: {
    label: "dApp",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10 border-indigo-400/30",
  },
};

export const opensourceProjects: OpenSourceProject[] = [
  // Desktop Apps
  {
    id: "keyrecorder",
    name: "KeyRecorder",
    description: "Windows keyboard activity monitoring app that tracks typing patterns, debug workflows, and boosts productivity with local-only data storage. Features 24/7 background recording, real-time visualization, and triple-database architecture.",
    type: "desktop-app",
    url: "https://github.com/gv211432/keyrecorder",
    image: "/img/opensource/keyrecorder.png",
    techStack: ["C#", ".NET 10", "WPF", "SQLite", "Named Pipes"],
    features: ["24/7 Background Recording", "Local-only Storage", "Real-time Visualization", "Configurable Retention"],
    highlighted: true,
  },

  // CLI Tools
  {
    id: "noise-image",
    name: "Noise Image",
    description: "CLI tool that adds realistic camera sensor noise to AI-generated images, making them feel raw and naturally captured. Features Gaussian noise distribution, luminance-dependent processing, and batch support.",
    type: "cli",
    url: "https://github.com/gv211432/noise-image",
    image: "/img/opensource/noise-image.png",
    techStack: ["TypeScript", "Sharp", "Bun"],
    features: ["Realistic Sensor Noise", "EXIF Preservation", "Batch Processing", "Multiple Presets"],
    highlighted: true,
  },
  {
    id: "sourcethecode",
    name: "SourceTheCode",
    description: "Powerful CLI and library that downloads and extracts source code from websites, capturing TypeScript, JavaScript, CSS files. Recovers original code from source maps and webpack bundles.",
    type: "cli",
    url: "https://github.com/gv211432/sourcethecode",
    image: "/img/opensource/sourcethecode.png",
    techStack: ["TypeScript", "Node.js", "Playwright"],
    features: ["Source Map Parsing", "Webpack Bundle Extraction", "Directory Hierarchy", "Duplicate Detection"],
    isNpm: true,
    highlighted: true,
  },

  // Mobile Apps
  {
    id: "intentsity",
    name: "Intentsity",
    description: "Android app designed to combat algorithmic addiction by prompting users to state their intention before using distracting apps. Introduces a cognitive speedbump for conscious app usage.",
    type: "mobile-app",
    url: "https://github.com/gv211432/Intentsity",
    image: "/img/opensource/intentsity.png",
    techStack: ["Kotlin", "Jetpack Compose", "Room", "Material 3"],
    features: ["App Interception", "Voice Input", "Analytics Tracking", "Privacy-first Design"],
    highlighted: true,
  },
  {
    id: "socialverse",
    name: "Socialverse",
    description: "React Native social media app with optimized reel streaming. Features smart content loading/unloading and load balancing between UI and JS threads for seamless scrolling.",
    type: "mobile-app",
    url: "https://github.com/gv211432/socialverse",
    image: "/img/opensource/socialverse.png",
    techStack: ["React Native", "Expo", "JavaScript"],
    features: ["Optimized Reel Loading", "Smart Unloading", "Smooth Scrolling", "Performance Optimized"],
  },

  // APIs
  {
    id: "memecoin-data",
    name: "Memecoin Data API",
    description: "Comprehensive REST API for aggregating Solana memecoin data from DexScreener, CoinGecko, GeckoTerminal, and more. Features intelligent fallback and graceful degradation.",
    type: "api",
    url: "https://github.com/gv211432/memecoin-data",
    image: "/img/opensource/memecoin-data.png",
    techStack: ["NestJS", "TypeScript", "Jest", "Docker"],
    features: ["Multi-source Aggregation", "Real-time Analytics", "Security Analysis", "Graceful Degradation"],
    highlighted: true,
  },

  // Websites
  {
    id: "sharewithqr",
    name: "ShareWithQR",
    description: "Multi-component application for sharing content via QR codes. Combines web and mobile interfaces for seamless cross-device file sharing.",
    type: "website",
    url: "https://github.com/gv211432/sharewithqr",
    image: "/img/opensource/sharewithqr.png",
    techStack: ["TypeScript", "JavaScript", "HTML", "CSS"],
    features: ["QR Code Generation", "Cross-device Sharing", "Web Interface", "Mobile Support"],
  },
  {
    id: "box-office",
    name: "Box Office",
    description: "Movie and actor search application using OkapiBM25 algorithm. Search and save film information with content-specific ranking.",
    type: "website",
    url: "https://github.com/gv211432/box-office",
    image: "/img/opensource/box-office.png",
    techStack: ["React", "TypeScript", "Yarn"],
    features: ["BM25 Search Algorithm", "Movie Database", "Actor Search", "Save Favorites"],
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    description: "React-based Tic Tac Toe game with computer opponent. Single-page application with desktop-like experience and responsive design.",
    type: "website",
    url: "https://github.com/gv211432/tictactoe",
    image: "/img/opensource/tictactoe.png",
    techStack: ["React.js", "JavaScript", "SCSS"],
    features: ["Play vs Computer", "Responsive Design", "Desktop-like UX", "Single Page App"],
  },
  {
    id: "gymwebsite",
    name: "Gym Website",
    description: "Fully functional frontend for a gym website built with ReactJS. Modern, dynamic interface for gym and fitness services.",
    type: "website",
    url: "https://github.com/gv211432/GymWebsite",
    image: "/img/opensource/gymwebsite.png",
    techStack: ["React.js", "JavaScript", "CSS"],
    features: ["Modern Design", "Dynamic Interface", "Responsive Layout", "Fast Performance"],
  },
  {
    id: "home-automation-website",
    name: "Home Automation UI",
    description: "TypeScript-based UI design platform for home automation projects. Features dashboard and landing page with remote management capabilities.",
    type: "website",
    url: "https://github.com/gv211432/home-automation-website",
    image: "/img/opensource/home-automation-website.png",
    techStack: ["TypeScript", "Express.js", "EJS", "MongoDB", "GraphQL"],
    features: ["Dashboard UI", "Remote Management", "WiFi Integration", "Responsive Design"],
  },

  // dApps
  {
    id: "todo-dapp",
    name: "Todo dApp",
    description: "Decentralized todo application built on Ethereum. Works with MetaMask and other wallets for on-chain task management.",
    type: "dapp",
    url: "https://github.com/gv211432/todo_dapp",
    image: "/img/opensource/todo-dapp.png",
    techStack: ["Solidity", "JavaScript", "Hardhat", "Redux"],
    features: ["MetaMask Integration", "On-chain Storage", "Smart Contracts", "Web3 Wallet Support"],
  },

  // Libraries
  {
    id: "boxes",
    name: "Boxes",
    description: "C++ header library that prints arrays, vectors, and 2D variants in visually formatted box structures. Great for debugging and visualization.",
    type: "library",
    url: "https://github.com/gv211432/boxes",
    image: "/img/opensource/boxes.png",
    techStack: ["C++", "Header-only"],
    features: ["Multiple Box Styles", "2D Array Support", "Custom Labels", "Index Display"],
  },

  // Firmware
  {
    id: "esp8266",
    name: "ESP8266 Manager",
    description: "Firmware project for ESP8266 microcontroller with WiFi and hotspot management. Includes filesystem and testing utilities.",
    type: "firmware",
    url: "https://github.com/gv211432/esp8266",
    image: "/img/opensource/esp8266.png",
    techStack: ["C++", "C", "HTML", "PlatformIO"],
    features: ["WiFi Management", "Hotspot Config", "Filesystem Support", "OTA Updates"],
  },

  // NPM Packages
  {
    id: "import-tree",
    name: "import-tree",
    description: "NPM package for visualizing and analyzing JavaScript/TypeScript import dependency trees. Helps understand project structure and circular dependencies.",
    type: "cli",
    url: "https://www.npmjs.com/package/import-tree",
    image: "/img/opensource/import-tree.png",
    techStack: ["JavaScript", "Node.js"],
    features: ["Dependency Visualization", "Tree Structure", "Circular Detection", "Project Analysis"],
    isNpm: true,
  },
  {
    id: "ch-nv",
    name: "ch-nv",
    description: "Lightweight NPM utility combining chalk and environment variable handling for colorful, environment-aware console outputs.",
    type: "library",
    url: "https://www.npmjs.com/package/ch-nv",
    image: "/img/opensource/ch-nv.png",
    techStack: ["JavaScript", "Node.js"],
    features: ["Colorful Output", "Env Variables", "Easy Integration", "Lightweight"],
    isNpm: true,
  },
  {
    id: "comp-2-webp",
    name: "comp-2-webp",
    description: "NPM package for compressing and converting images to WebP format. Optimizes images for web with configurable quality settings.",
    type: "cli",
    url: "https://www.npmjs.com/package/comp-2-webp",
    image: "/img/opensource/comp-2-webp.png",
    techStack: ["JavaScript", "Sharp", "Node.js"],
    features: ["WebP Conversion", "Image Compression", "Batch Processing", "Quality Config"],
    isNpm: true,
  },
  {
    id: "port2port",
    name: "port2port",
    description: "Simple port forwarding utility for Node.js. Forward traffic between ports with minimal configuration for development and testing.",
    type: "cli",
    url: "https://www.npmjs.com/package/port2port",
    image: "/img/opensource/port2port.png",
    techStack: ["JavaScript", "Node.js"],
    features: ["Port Forwarding", "Minimal Config", "Dev Friendly", "Cross-platform"],
    isNpm: true,
  },
  {
    id: "sourcethecode-npm",
    name: "sourcethecode (npm)",
    description: "NPM package version of SourceTheCode. Install globally or use programmatically to extract website source code.",
    type: "library",
    url: "https://www.npmjs.com/package/sourcethecode",
    image: "/img/opensource/sourcethecode.png",
    techStack: ["TypeScript", "Playwright", "Node.js"],
    features: ["Global CLI", "Programmatic API", "Source Extraction", "Webpack Support"],
    isNpm: true,
  },
];

export const getProjectsByType = (type: ProjectType): OpenSourceProject[] => {
  return opensourceProjects.filter((project) => project.type === type);
};

export const getHighlightedProjects = (): OpenSourceProject[] => {
  return opensourceProjects.filter((project) => project.highlighted);
};

export const getNpmPackages = (): OpenSourceProject[] => {
  return opensourceProjects.filter((project) => project.isNpm);
};
