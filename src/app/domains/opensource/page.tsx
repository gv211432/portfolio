"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  opensourceProjects,
  projectTypeInfo,
  getHighlightedProjects,
  getNpmPackages,
  type ProjectType,
  type OpenSourceProject,
} from "@/data/opensourceProjects";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { globalConfig, domainUrls } from "@/config/global";
import { Logo, FloroActionButton } from "@/components/ui";

// React Icons imports
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaArrowRight,
  FaExternalLinkAlt,
  FaTerminal,
  FaMobile,
  FaDesktop,
  FaServer,
  FaMicrochip,
  FaCubes,
  FaGlobe,
  FaCode,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { TbLayoutGrid, TbList, TbFilter } from "react-icons/tb";
import { SiNpm } from "react-icons/si";

// Icon mapping for project types
const typeIconMap: Record<ProjectType, React.ReactNode> = {
  cli: <FaTerminal className="w-5 h-5" />,
  library: <FaCubes className="w-5 h-5" />,
  website: <FaGlobe className="w-5 h-5" />,
  "mobile-app": <FaMobile className="w-5 h-5" />,
  "desktop-app": <FaDesktop className="w-5 h-5" />,
  api: <FaServer className="w-5 h-5" />,
  firmware: <FaMicrochip className="w-5 h-5" />,
  dapp: <FaCode className="w-5 h-5" />,
};

const projectTypes: { key: ProjectType | "all"; label: string }[] = [
  { key: "all", label: "All Projects" },
  { key: "cli", label: "CLI" },
  { key: "library", label: "Library" },
  { key: "website", label: "Website" },
  { key: "mobile-app", label: "Mobile" },
  { key: "desktop-app", label: "Desktop" },
  { key: "api", label: "API" },
  { key: "dapp", label: "dApp" },
  { key: "firmware", label: "Firmware" },
];

// Project Card Component
const ProjectCard = ({
  project,
  index,
  viewMode,
}: {
  project: OpenSourceProject;
  index: number;
  viewMode: "grid" | "list";
}) => {
  const typeInfo = projectTypeInfo[project.type];

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="flex items-center gap-6 p-4 bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-xl transition-all duration-300 hover:shadow-lg">
            {/* Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-cyan/20 to-primary/20 flex-shrink-0">
              <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center text-cyan">
                {typeIconMap[project.type]}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors truncate">
                  {project.name}
                </h3>
                {project.isNpm && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-medium">
                    <SiNpm className="w-3 h-3" />
                    npm
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.bgColor} ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              <p className="text-sm text-primaryDark/60 dark:text-gray-400 line-clamp-1 mb-2">
                {project.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span key={tech} className="text-xs text-primaryDark/50 dark:text-gray-500 bg-primary/10 px-2 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <FaExternalLinkAlt className="w-4 h-4 text-primaryDark/30 dark:text-gray-600 group-hover:text-cyan transition-colors flex-shrink-0" />
          </div>
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group h-full"
      >
        <div className="group h-full bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1">
          {/* Hero Image Placeholder */}
          <div className="relative h-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/20 to-primary/30" />
            <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/80 transform group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 rounded-2xl bg-obsidian/50 backdrop-blur-sm flex items-center justify-center">
                  {typeIconMap[project.type]}
                </div>
              </div>
            </div>
            {project.highlighted && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-obsidian/80 backdrop-blur-sm rounded-full text-cyan text-xs font-semibold">
                <HiSparkles className="w-3 h-3" />
                Featured
              </div>
            )}
            {project.isNpm && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                <SiNpm className="w-3 h-3" />
                npm
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.bgColor} ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-primaryDark dark:text-white mb-2 group-hover:text-cyan transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-primaryDark/60 dark:text-gray-400 line-clamp-2 mb-4">
              {project.description}
            </p>

            {/* Tech Stack */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {project.techStack.slice(0, 3).map((tech) => (
                <span key={tech} className="text-xs text-primaryDark/50 dark:text-gray-500 bg-primary/10 px-2 py-0.5 rounded">
                  {tech}
                </span>
              ))}
              {project.techStack.length > 3 && (
                <span className="text-xs text-primaryDark/40 dark:text-gray-600">
                  +{project.techStack.length - 3}
                </span>
              )}
            </div>

            {/* Features */}
            <div className="flex items-center gap-2 text-xs text-cyan">
              <span>View on {project.isNpm ? "npm" : "GitHub"}</span>
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </a>
    </motion.div>
  );
};

// Featured Carousel Component
const FeaturedCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredProjects = getHighlightedProjects();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProjects.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredProjects.length]);

  const project = featuredProjects[currentIndex];
  const typeInfo = projectTypeInfo[project.type];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian via-obsidian-50 to-obsidian border border-primary/20">
      <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-10" />

      <div className="relative z-10 p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${typeInfo.bgColor} ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  {project.isNpm && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-medium">
                      <SiNpm className="w-3 h-3" />
                      npm package
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-cyan text-xs">
                    <HiSparkles className="w-4 h-4" />
                    Featured
                  </span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  {project.name}
                </h2>
                <p className="text-gray-400 mb-6 line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-gray-300">
                      {tech}
                    </span>
                  ))}
                </div>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-obsidian font-semibold rounded-xl hover:bg-cyan/90 transition-colors"
                >
                  {project.isNpm ? <SiNpm className="w-5 h-5" /> : <FaGithub className="w-5 h-5" />}
                  View on {project.isNpm ? "npm" : "GitHub"}
                  <FaArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Visual */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-video rounded-2xl bg-gradient-to-br from-cyan/10 to-primary/10 border border-primary/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-3xl bg-obsidian/80 backdrop-blur-sm flex items-center justify-center text-cyan [&>svg]:w-12 [&>svg]:h-12">
                    {typeIconMap[project.type]}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {featuredProjects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? "w-8 bg-cyan" : "bg-gray-600 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Stats Component
const Stats = () => {
  const npmPackages = getNpmPackages();
  const stats = [
    { value: opensourceProjects.length.toString(), label: "Projects" },
    { value: npmPackages.length.toString(), label: "NPM Packages" },
    { value: "10+", label: "Technologies" },
    { value: "MIT", label: "License" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="text-center p-6 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl"
        >
          <div className="text-3xl font-bold text-cyan mb-1">{stat.value}</div>
          <div className="text-sm text-primaryDark/60 dark:text-gray-400">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default function OpenSourcePage() {
  const [selectedType, setSelectedType] = useState<ProjectType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { darkMode } = useDarkModeStore();

  const filteredProjects = opensourceProjects.filter((project) => {
    const matchesType = selectedType === "all" || project.type === selectedType;
    const matchesSearch =
      searchQuery === "" ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-light dark:bg-obsidian transition-colors duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Logo size="lg" href={domainUrls.root} />

              <nav className="hidden md:flex items-center gap-6">
                <Link href={domainUrls.root} className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm">
                  Home
                </Link>
                <Link href={domainUrls.whitelabel} className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm">
                  Products
                </Link>
                <span className="text-cyan font-medium text-sm">Open Source</span>
              </nav>

              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/gv211432"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <section className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/30 rounded-full text-cyan text-sm font-medium mb-6">
                  <FaGithub className="w-4 h-4" />
                  Open Source Contributions
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primaryDark dark:text-white mb-6">
                  Building in{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary font-cinzel font-black">
                    Public
                  </span>
                </h1>
                <p className="text-lg text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
                  A collection of open source projects spanning CLIs, libraries, mobile apps,
                  web applications, and more. All freely available on GitHub and npm.
                </p>
              </motion.div>
            </section>

            {/* Stats */}
            <section className="mb-16">
              <Stats />
            </section>

            {/* Featured Carousel */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-primaryDark dark:text-white mb-6">
                Featured Projects
              </h2>
              <FeaturedCarousel />
            </section>

            {/* Filters and Search */}
            <section className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-xl text-primaryDark dark:text-white placeholder-primaryDark/40 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 transition-colors"
                  />
                  <TbFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primaryDark/40 dark:text-gray-500" />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "grid"
                        ? "bg-cyan text-obsidian"
                        : "bg-light dark:bg-obsidian-50 text-primaryDark/70 dark:text-gray-400 hover:text-cyan"
                    }`}
                  >
                    <TbLayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-cyan text-obsidian"
                        : "bg-light dark:bg-obsidian-50 text-primaryDark/70 dark:text-gray-400 hover:text-cyan"
                    }`}
                  >
                    <TbList className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Type Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                {projectTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedType === type.key
                        ? "bg-cyan text-obsidian"
                        : "bg-light dark:bg-obsidian-50 border border-primary/20 text-primaryDark/70 dark:text-gray-400 hover:border-cyan/50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Projects Grid/List */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primaryDark dark:text-white">
                  All Projects
                </h2>
                <span className="text-sm text-primaryDark/60 dark:text-gray-400">
                  {filteredProjects.length} projects
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedType}-${viewMode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "flex flex-col gap-4"
                  }
                >
                  {filteredProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      viewMode={viewMode}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {filteredProjects.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-primaryDark/60 dark:text-gray-400">
                    No projects found matching your criteria.
                  </p>
                </div>
              )}
            </section>

            {/* NPM Section */}
            <section className="mt-16">
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <SiNpm className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primaryDark dark:text-white">
                      NPM Packages
                    </h2>
                    <p className="text-sm text-primaryDark/60 dark:text-gray-400">
                      Install directly from npm registry
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getNpmPackages().map((pkg) => (
                    <a
                      key={pkg.id}
                      href={pkg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 p-4 bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-red-500/50 rounded-xl transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        <SiNpm className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primaryDark dark:text-white group-hover:text-red-400 transition-colors truncate">
                          {pkg.name}
                        </h3>
                        <code className="text-xs text-primaryDark/50 dark:text-gray-500">
                          npm i {pkg.name}
                        </code>
                      </div>
                      <FaExternalLinkAlt className="w-4 h-4 text-primaryDark/30 dark:text-gray-600 group-hover:text-red-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="mt-16 text-center">
              <div className="bg-gradient-to-br from-cyan/10 to-primary/10 border border-cyan/20 rounded-3xl p-8 lg:p-12">
                <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white mb-4">
                  Want to Collaborate?
                </h2>
                <p className="text-primaryDark/60 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                  Open for contributions, feature requests, and collaborations.
                  Check out the repositories or reach out directly.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <a
                    href="https://github.com/gv211432"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-obsidian dark:bg-white text-white dark:text-obsidian font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <FaGithub className="w-5 h-5" />
                    Follow on GitHub
                  </a>
                  <FloroActionButton href={domainUrls.root} asLink className="px-6 py-3 rounded-xl">
                    Contact Me
                    <FaArrowRight className="w-4 h-4 ml-2" />
                  </FloroActionButton>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-primary/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/gv211432"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/in/AstroX11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/AstroX11_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
              </div>
              <p className="text-primaryDark/50 dark:text-gray-500 text-sm">
                © {new Date().getFullYear()} {globalConfig.displayName}. All projects open source.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
