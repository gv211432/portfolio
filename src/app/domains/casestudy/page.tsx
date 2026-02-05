"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  caseStudies,
  industryInfo,
  type CaseStudy,
} from "@/data/caseStudiesData";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import DarkModeToggleButton from "@/components/inputs/DarkModeToggleButton";
import { domainUrls } from "@/config/global";
import {
  Logo,
  ContactDetails,
  FloroActionButton,
  PrimaryActionButton,
} from "@/components/ui";

// React Icons imports
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaArrowRight,
  FaCoins,
  FaTelegram,
  FaQuoteLeft,
} from "react-icons/fa";
import { TbChartCandle } from "react-icons/tb";
import { HiSparkles, HiLightningBolt } from "react-icons/hi";
import { BsGraphUp, BsCheckCircle } from "react-icons/bs";

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  FaCoins: <FaCoins className="w-10 h-10" />,
  FaTelegram: <FaTelegram className="w-10 h-10" />,
  TbChartCandle: <TbChartCandle className="w-10 h-10" />,
};

// Case Study Card Component
const CaseStudyCard = ({
  caseStudy,
  index,
}: {
  caseStudy: CaseStudy;
  index: number;
}) => {
  const indInfo = industryInfo[caseStudy.industry];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Link href={`/case-studies/${caseStudy.slug}`}>
        <div className="group h-full bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1">
          {/* Hero Section */}
          <div className="relative h-48 overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${caseStudy.gradient} opacity-90`}
            />
            <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-20" />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/90 transform group-hover:scale-110 transition-transform duration-300">
                {iconMap[caseStudy.icon]}
              </div>
            </div>

            {/* Featured Badge */}
            {caseStudy.featured && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-obsidian/80 backdrop-blur-sm rounded-full text-cyan text-xs font-semibold">
                <HiSparkles className="w-3.5 h-3.5" />
                Featured
              </div>
            )}

            {/* Industry Badge */}
            <div className="absolute bottom-4 left-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-obsidian/50 ${indInfo.color} border-white/20`}
              >
                {indInfo.label}
              </span>
            </div>

            {/* Key Result */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-2xl font-bold text-white">
                {caseStudy.snapshot.keyResult}
              </div>
              <div className="text-xs text-white/80">
                {caseStudy.snapshot.keyResultLabel}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-primaryDark dark:text-white mb-2 group-hover:text-cyan transition-colors">
              {caseStudy.shortTitle}
            </h3>
            <p className="text-sm text-primary dark:text-cyan/80 font-medium mb-3">
              {caseStudy.tagline}
            </p>
            <p className="text-primaryDark/60 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {caseStudy.description}
            </p>

            {/* Tech Stack Preview */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {caseStudy.snapshot.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="text-xs text-primaryDark/50 dark:text-gray-500 bg-primary/10 px-2 py-0.5 rounded"
                >
                  {tech}
                </span>
              ))}
              {caseStudy.snapshot.techStack.length > 4 && (
                <span className="text-xs text-primary">
                  +{caseStudy.snapshot.techStack.length - 4}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-primary/10">
              <span className="text-sm text-primaryDark/60 dark:text-gray-400">
                {caseStudy.snapshot.timeline} · {caseStudy.clientName}
              </span>
              <span className="inline-flex items-center gap-1 text-cyan text-sm font-medium group-hover:gap-2 transition-all">
                Read Story
                <FaArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Stats Section
const StatsSection = () => {
  const stats = [
    { value: "$1M+", label: "Client Revenue Generated" },
    { value: "3", label: "Success Stories" },
    { value: "100%", label: "Client Satisfaction" },
    { value: "9+", label: "Months Total Development" },
  ];

  return (
    <div className="bg-gradient-to-r from-primary/5 via-cyan/5 to-primary/5 border-y border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
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
                {stat.value}
              </div>
              <div className="text-primaryDark/70 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Featured Testimonial
const FeaturedTestimonial = () => {
  const featured = caseStudies.find((cs) => cs.testimonial);
  if (!featured?.testimonial) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-obsidian via-obsidian-50 to-obsidian border border-primary/20 rounded-3xl p-8 lg:p-12"
    >
      <FaQuoteLeft className="w-10 h-10 text-cyan/30 mb-6" />
      <p className="text-xl lg:text-2xl text-white font-medium mb-8 leading-relaxed">
        "{featured.testimonial.quote}"
      </p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan to-primary flex items-center justify-center text-white font-bold text-xl">
          {featured.testimonial.author.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-white">
            {featured.testimonial.author}
          </div>
          <div className="text-gray-400">
            {featured.testimonial.role}, {featured.testimonial.company}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function CaseStudyPage() {
  const { darkMode } = useDarkModeStore();

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-light dark:bg-obsidian transition-colors duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Logo size="lg" href={domainUrls.root} />

              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href={domainUrls.root}
                  className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm"
                >
                  Home
                </Link>
                <Link
                  href={domainUrls.whitelabel}
                  className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm"
                >
                  Products
                </Link>
                <span className="text-cyan font-medium text-sm">
                  Case Studies
                </span>
              </nav>

              <div className="flex items-center gap-4">
                <ContactDetails compact className="hidden lg:flex" />
                <DarkModeToggleButton />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-light to-secondary dark:from-obsidian dark:via-obsidian-50 dark:to-obsidian transition-colors duration-300" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan/10 dark:bg-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/30 rounded-full text-cyan text-sm font-medium mb-6">
                <BsGraphUp className="w-4 h-4" />
                Success Stories
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-primaryDark dark:text-white leading-tight mb-6">
                Real Results,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary font-cinzel font-black">
                  Real Impact
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-primaryDark/70 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                Explore how we've helped businesses transform their ideas into
                successful products. From fintech to crypto, see the measurable
                impact of our work.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <FloroActionButton href="#case-studies">
                  View Case Studies
                </FloroActionButton>
                <PrimaryActionButton href={`mailto:contact@gaurav.one`}>
                  Discuss Your Project
                </PrimaryActionButton>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* Case Studies Grid */}
        <section id="case-studies" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mb-4">
                Featured Case Studies
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
                Deep dives into our most impactful projects - the challenges,
                solutions, and results.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {caseStudies.map((caseStudy, index) => (
                <CaseStudyCard
                  key={caseStudy.id}
                  caseStudy={caseStudy}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Why Work With Us */}
        <section className="py-20 bg-gradient-to-b from-transparent to-primary/5 dark:to-obsidian-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
                The Gaurav.one Difference
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
                What sets us apart from typical development agencies
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <HiLightningBolt className="w-8 h-8" />,
                  title: "Speed to Market",
                  description:
                    "We focus on delivering working products fast. Average project delivery is under 4 months.",
                },
                {
                  icon: <BsCheckCircle className="w-8 h-8" />,
                  title: "Business-First Approach",
                  description:
                    "We don't just write code. We understand your business goals and architect solutions that drive real ROI.",
                },
                {
                  icon: <BsGraphUp className="w-8 h-8" />,
                  title: "Proven Results",
                  description:
                    "20x ROI, $140K MRR, 2x user growth - our track record speaks for itself.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center text-cyan">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-primaryDark dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-primaryDark/60 dark:text-gray-400">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedTestimonial />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-cyan/10 to-primary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mb-6">
                Ready to Be Our Next Success Story?
              </h2>
              <p className="text-primaryDark/70 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Let's discuss how we can help you achieve results like these.
                Whether you're starting from scratch or scaling an existing
                product.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <FloroActionButton href="mailto:contact@gaurav.one?subject=New Project Inquiry">
                  Start Your Project
                  <FaArrowRight className="w-4 h-4 ml-2" />
                </FloroActionButton>
                <PrimaryActionButton href={domainUrls.whitelabel} asLink>
                  View Products
                </PrimaryActionButton>
              </div>
            </motion.div>
          </div>
        </section>

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
                  href="https://twitter.com/formal_gaurav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primaryDark/50 dark:text-gray-500 hover:text-cyan transition-colors"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
              </div>
              <ContactDetails />
              <p className="text-primaryDark/50 dark:text-gray-500 text-sm">
                © {new Date().getFullYear()} Gaurav.one. Building success
                stories.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
