"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  jobPositions,
  departmentInfo,
  jobTypeInfo,
  getFeaturedJobs,
  type JobDepartment,
  type JobPosition,
} from "@/data/careersData";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import DarkModeToggleButton from "@/components/inputs/DarkModeToggleButton";
import { globalConfig, domainUrls } from "@/config/global";
import { Logo } from "@/components/ui";

// React Icons imports
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaArrowRight,
  FaCode,
  FaServer,
  FaShieldAlt,
  FaPaintBrush,
  FaReact,
  FaDatabase,
  FaFileContract,
  FaGlobeAmericas,
  FaBitcoin,
  FaCheck,
} from "react-icons/fa";
import { HiSparkles, HiLocationMarker, HiBriefcase } from "react-icons/hi";
import { SiSolana, SiEthereum } from "react-icons/si";

// Icon mapping for jobs
const iconMap: Record<string, React.ReactNode> = {
  FaCode: <FaCode className="w-6 h-6" />,
  FaServer: <FaServer className="w-6 h-6" />,
  FaShieldAlt: <FaShieldAlt className="w-6 h-6" />,
  FaPaintBrush: <FaPaintBrush className="w-6 h-6" />,
  FaReact: <FaReact className="w-6 h-6" />,
  FaDatabase: <FaDatabase className="w-6 h-6" />,
  FaFileContract: <FaFileContract className="w-6 h-6" />,
};

const departments: { key: JobDepartment | "all"; label: string }[] = [
  { key: "all", label: "All Roles" },
  { key: "engineering", label: "Engineering" },
  { key: "design", label: "Design" },
  { key: "security", label: "Security" },
  { key: "devops", label: "DevOps" },
];

// Animated blockchain background
const BlockchainBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5" />
    {/* Floating blockchain nodes */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-3 h-3 rounded-full bg-cyan-600/60 dark:bg-cyan/30"
        style={{
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    {/* Connection lines */}
    <svg className="absolute inset-0 w-full h-full opacity-30 dark:opacity-10">
      <motion.path
        d="M100,100 Q300,50 500,150 T900,100"
        stroke="url(#lineGrad)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="5 5"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D9FF" />
          <stop offset="100%" stopColor="#8b94cb" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Job Card Component
const JobCard = ({ job, index }: { job: JobPosition; index: number }) => {
  const deptInfo = departmentInfo[job.department];
  const typeInfo = jobTypeInfo[job.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/jobs/${job.slug}`}>
        <div className="group relative h-full bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1">
          {/* Gradient header */}
          <div className={`h-2 bg-gradient-to-r ${job.gradient}`} />

          <div className="p-6">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${deptInfo.bgColor} ${deptInfo.color}`}>
                {deptInfo.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {job.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan/10 border border-cyan/30 text-cyan">
                  <HiSparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            {/* Icon and Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${job.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                {iconMap[job.icon]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-primaryDark/60 dark:text-gray-400 mt-1">
                  <HiLocationMarker className="w-4 h-4" />
                  {job.location}
                </div>
              </div>
            </div>

            {/* Tech Stack Preview */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {job.techStack.slice(0, 4).map((tech) => (
                <span key={tech} className="text-xs text-primaryDark/50 dark:text-gray-500 bg-primary/10 px-2 py-0.5 rounded">
                  {tech}
                </span>
              ))}
              {job.techStack.length > 4 && (
                <span className="text-xs text-primaryDark/40 dark:text-gray-600">
                  +{job.techStack.length - 4}
                </span>
              )}
            </div>

            {/* Apply button */}
            <div className="flex items-center gap-2 text-sm text-cyan font-medium">
              <span>View & Apply</span>
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Values Section
const ValuesSection = () => {
  const values = [
    {
      icon: <FaGlobeAmericas className="w-8 h-8" />,
      title: "Global & Inclusive",
      description: "We hire irrespective of cast, color, nationality, gender, or timezone. Talent has no borders.",
    },
    {
      icon: <HiBriefcase className="w-8 h-8" />,
      title: "Ability to Deliver",
      description: "The only skill that matters. Show us what you've built and the impact it created.",
    },
    {
      icon: <FaBitcoin className="w-8 h-8" />,
      title: "Crypto-Friendly Payments",
      description: "We pay via international wire transfers or crypto (USDC/USDT). Your choice.",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {values.map((value, index) => (
        <motion.div
          key={value.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="text-center p-6 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center text-cyan">
            {value.icon}
          </div>
          <h3 className="text-lg font-bold text-primaryDark dark:text-white mb-2">{value.title}</h3>
          <p className="text-sm text-primaryDark/60 dark:text-gray-400">{value.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Stats Section
const StatsSection = () => {
  const stats = [
    { value: jobPositions.length.toString(), label: "Open Positions" },
    { value: "100%", label: "Remote Friendly" },
    { value: "24/7", label: "Async Work" },
    { value: "USDC/USDT", label: "Crypto Payments" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="text-center p-6 bg-gradient-to-br from-cyan/5 to-primary/5 border border-primary/20 rounded-2xl"
        >
          <div className="text-2xl md:text-3xl font-bold text-cyan mb-1">{stat.value}</div>
          <div className="text-xs md:text-sm text-primaryDark/60 dark:text-gray-400">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<JobDepartment | "all">("all");
  const { darkMode } = useDarkModeStore();

  const filteredJobs = selectedDepartment === "all"
    ? jobPositions
    : jobPositions.filter((job) => job.department === selectedDepartment);

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
                <Link href={domainUrls.opensource} className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm">
                  Open Source
                </Link>
                <span className="text-cyan font-medium text-sm">Careers</span>
              </nav>

              <div className="flex items-center gap-4">
                <DarkModeToggleButton />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <BlockchainBackground />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Blockchain badges */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                    <SiSolana className="w-4 h-4" />
                    Solana
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                    <SiEthereum className="w-4 h-4" />
                    Ethereum
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan/10 border border-cyan/30 rounded-full text-cyan text-sm">
                    <HiSparkles className="w-4 h-4" />
                    Web3
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primaryDark dark:text-white mb-6">
                  Build the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-primary to-purple-400 font-cinzel font-black">
                    Decentralized Future
                  </span>
                </h1>
                <p className="text-lg text-primaryDark/60 dark:text-gray-400 mb-8">
                  We accept applications throughout the year. We hire irrespective of cast, color,
                  nationality, gender, or timezone. The only skill we look for:{" "}
                  <span className="text-cyan font-semibold">Ability to Deliver</span>.
                </p>

                {/* CTA */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <a
                    href="#positions"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-obsidian font-semibold rounded-xl hover:bg-cyan/90 transition-colors"
                  >
                    View Open Positions
                    <FaArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <StatsSection />
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-gradient-to-b from-transparent to-primary/5 dark:to-obsidian-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
                Why Join Us?
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
                We believe in building products that matter, with people who care.
              </p>
            </motion.div>
            <ValuesSection />
          </div>
        </section>

        {/* What We Look For */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-6">
                  What We Look For
                </h2>
                <p className="text-primaryDark/70 dark:text-gray-400 mb-6">
                  Share your resume focusing on <span className="text-cyan font-semibold">what you have delivered</span> in
                  the past and <span className="text-cyan font-semibold">what impact it created</span>. We value results
                  over credentials.
                </p>
                <ul className="space-y-4">
                  {[
                    "Proven track record of shipping products",
                    "Self-motivated and able to work asynchronously",
                    "Strong communication skills",
                    "Passion for blockchain and Web3",
                    "Willingness to learn and adapt",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FaCheck className="w-3 h-3 text-cyan" />
                      </div>
                      <span className="text-primaryDark/70 dark:text-gray-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-obsidian via-obsidian-50 to-obsidian border border-primary/20 rounded-3xl p-8"
              >
                <h3 className="text-xl font-bold text-white mb-4">Payment Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FaGlobeAmericas className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">International Wire</h4>
                      <p className="text-sm text-gray-400">Bank transfers worldwide</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 font-bold">$</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">USDC / USDT</h4>
                      <p className="text-sm text-gray-400">Stablecoin payments on-chain</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Choose what works best for you. We're flexible.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section id="positions" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
                Open Positions
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
                Find your next role and help us build the decentralized future.
              </p>
            </motion.div>

            {/* Department Filter */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {departments.map((dept) => (
                <button
                  key={dept.key}
                  onClick={() => setSelectedDepartment(dept.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedDepartment === dept.key
                      ? "bg-cyan text-obsidian"
                      : "bg-light dark:bg-obsidian-50 border border-primary/20 text-primaryDark/70 dark:text-gray-400 hover:border-cyan/50"
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </div>

            {/* Jobs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-primaryDark/60 dark:text-gray-400">
                  No positions available in this department at the moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-cyan/10 to-primary/10 border border-cyan/20 rounded-3xl p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white mb-4">
                Don't See Your Role?
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                We're always looking for talented individuals. Send us your resume and
                tell us how you can contribute.
              </p>
              <a
                href={`mailto:${globalConfig.email}?subject=Career Inquiry`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-obsidian font-semibold rounded-xl hover:bg-cyan/90 transition-colors"
              >
                Get in Touch
                <FaArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-primary/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <a
                  href={globalConfig.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
                <a
                  href={globalConfig.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
                <a
                  href={globalConfig.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
              </div>
              <p className="text-primaryDark/50 dark:text-gray-500 text-sm">
                © {new Date().getFullYear()} {globalConfig.displayName}. Building the decentralized future.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
