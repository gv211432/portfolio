"use client";
import React, { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCaseStudyBySlug,
  industryInfo,
  caseStudies,
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
  FaArrowLeft,
  FaCoins,
  FaTelegram,
  FaQuoteLeft,
  FaExternalLinkAlt,
  FaCheck,
  FaClock,
  FaIndustry,
  FaCode,
  FaTrophy,
} from "react-icons/fa";
import { TbChartCandle } from "react-icons/tb";
import {
  HiSparkles,
  HiLightningBolt,
  HiExclamation,
  HiLightBulb,
} from "react-icons/hi";
import { BsGraphUp, BsCheckCircle } from "react-icons/bs";

// Icon mapping - large icons for hero sections
const iconMap: Record<string, React.ReactNode> = {
  FaCoins: <FaCoins className="w-16 h-16" />,
  FaTelegram: <FaTelegram className="w-16 h-16" />,
  TbChartCandle: <TbChartCandle className="w-16 h-16" />,
};

// Small icon mapping for cards
const smallIconMap: Record<string, React.ReactNode> = {
  FaCoins: <FaCoins className="w-6 h-6" />,
  FaTelegram: <FaTelegram className="w-6 h-6" />,
  TbChartCandle: <TbChartCandle className="w-6 h-6" />,
};

// Snapshot Card
const SnapshotCard = ({ caseStudy }: { caseStudy: CaseStudy }) => {
  const indInfo = industryInfo[caseStudy.industry];

  return (
    <div className="bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl p-6 sticky top-24">
      <h3 className="text-lg font-bold text-primaryDark dark:text-white mb-6">
        Project Snapshot
      </h3>

      {/* Key Result */}
      <div className="mb-6 p-4 bg-gradient-to-br from-cyan/10 to-primary/10 border border-cyan/20 rounded-xl text-center">
        <div className="text-4xl font-bold text-cyan mb-1">
          {caseStudy.snapshot.keyResult}
        </div>
        <div className="text-sm text-primaryDark/60 dark:text-gray-400">
          {caseStudy.snapshot.keyResultLabel}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <FaIndustry className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="text-xs text-primaryDark/50 dark:text-gray-500 uppercase tracking-wider">
              Industry
            </div>
            <div className="text-primaryDark dark:text-white font-medium">
              {caseStudy.snapshot.industry}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FaClock className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="text-xs text-primaryDark/50 dark:text-gray-500 uppercase tracking-wider">
              Timeline
            </div>
            <div className="text-primaryDark dark:text-white font-medium">
              {caseStudy.snapshot.timeline}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FaCode className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <div className="text-xs text-primaryDark/50 dark:text-gray-500 uppercase tracking-wider mb-2">
              Tech Stack
            </div>
            <div className="flex flex-wrap gap-1.5">
              {caseStudy.snapshot.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-2 py-1 bg-primary/10 text-primaryDark dark:text-gray-300 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-6 border-t border-primary/10">
        <FloroActionButton
          href="mailto:contact@gaurav.one?subject=Project Inquiry"
          className="w-full justify-center"
        >
          Start Similar Project
        </FloroActionButton>
      </div>

      {caseStudy.liveUrl && (
        <a
          href={caseStudy.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-sm text-primary hover:text-cyan transition-colors"
        >
          View Live Site
          <FaExternalLinkAlt className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

// Section Component
const Section = ({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className={`mb-12 ${className}`}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-primary/20 flex items-center justify-center text-cyan">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-primaryDark dark:text-white">
        {title}
      </h2>
    </div>
    {children}
  </motion.div>
);

// Related Case Studies
const RelatedCaseStudies = ({ currentSlug }: { currentSlug: string }) => {
  const related = caseStudies.filter((cs) => cs.slug !== currentSlug).slice(0, 2);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {related.map((cs) => {
        const indInfo = industryInfo[cs.industry];
        return (
          <Link key={cs.id} href={`/case-studies/${cs.slug}`}>
            <div className="group bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-xl p-6 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cs.gradient} flex items-center justify-center text-white flex-shrink-0`}
                >
                  {smallIconMap[cs.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${indInfo.bgColor} ${indInfo.color} mb-2`}
                  >
                    {indInfo.label}
                  </span>
                  <h3 className="text-lg font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors truncate">
                    {cs.shortTitle}
                  </h3>
                  <p className="text-sm text-primaryDark/60 dark:text-gray-400 mt-1">
                    {cs.tagline}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default function CaseStudyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { darkMode, initializeDarkMode } = useDarkModeStore();

  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  const caseStudy = getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  const indInfo = industryInfo[caseStudy.industry];

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-light dark:bg-obsidian transition-colors duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/domains/casestudy"
                  className="flex items-center gap-2 text-primaryDark/60 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <div className="h-6 w-px bg-primary/20" />
                <Logo size="md" href={domainUrls.root} />
              </div>

              <div className="flex items-center gap-4">
                <ContactDetails compact className="hidden lg:flex" />
                <DarkModeToggleButton />
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-24 lg:pt-32 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-light to-secondary dark:from-obsidian dark:via-obsidian-50 dark:to-obsidian transition-colors duration-300" />
          <div
            className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${caseStudy.gradient} opacity-10 rounded-full blur-[120px]`}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Breadcrumb & Tags */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${indInfo.bgColor} ${indInfo.color}`}
                  >
                    {indInfo.label}
                  </span>
                  {caseStudy.featured && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan/10 border border-cyan/30 rounded-full text-cyan text-xs font-medium">
                      <HiSparkles className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                  {caseStudy.completedAt && (
                    <span className="text-sm text-primaryDark/50 dark:text-gray-500">
                      Completed {caseStudy.completedAt}
                    </span>
                  )}
                </div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl lg:text-5xl font-bold text-primaryDark dark:text-white mb-4"
                >
                  {caseStudy.title}
                </motion.h1>

                {/* Tagline */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-xl text-cyan font-medium mb-6"
                >
                  {caseStudy.tagline}
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg text-primaryDark/70 dark:text-gray-400 mb-8"
                >
                  {caseStudy.description}
                </motion.p>

                {/* Client Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-primary flex items-center justify-center text-white font-bold text-lg">
                    {caseStudy.clientName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-primaryDark dark:text-white">
                      {caseStudy.clientName}
                    </div>
                    {caseStudy.clientRole && (
                      <div className="text-sm text-primaryDark/60 dark:text-gray-400">
                        {caseStudy.clientRole}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar - Snapshot */}
              <div className="lg:col-span-1">
                <SnapshotCard caseStudy={caseStudy} />
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-12">
                {/* Challenge Section */}
                <Section
                  icon={<HiExclamation className="w-5 h-5" />}
                  title={caseStudy.challenge.title}
                >
                  <p className="text-primaryDark/70 dark:text-gray-400 mb-6 leading-relaxed">
                    {caseStudy.challenge.description}
                  </p>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                    <h4 className="font-semibold text-red-400 mb-4">
                      Key Pain Points
                    </h4>
                    <ul className="space-y-3">
                      {caseStudy.challenge.painPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                          </span>
                          <span className="text-primaryDark/70 dark:text-gray-400">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Section>

                {/* Solution Section */}
                <Section
                  icon={<HiLightBulb className="w-5 h-5" />}
                  title={caseStudy.solution.title}
                >
                  <p className="text-primaryDark/70 dark:text-gray-400 mb-6 leading-relaxed">
                    {caseStudy.solution.description}
                  </p>

                  <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-cyan mb-4">
                      Our Approach
                    </h4>
                    <ul className="space-y-3">
                      {caseStudy.solution.approach.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FaCheck className="w-3 h-3 text-cyan" />
                          </span>
                          <span className="text-primaryDark/70 dark:text-gray-400">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {caseStudy.solution.technicalHighlights && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                      <h4 className="font-semibold text-primary mb-4">
                        Technical Highlights
                      </h4>
                      <ul className="space-y-2">
                        {caseStudy.solution.technicalHighlights.map(
                          (item, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-sm"
                            >
                              <FaCode className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-primaryDark/70 dark:text-gray-400">
                                {item}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </Section>

                {/* Impact Section */}
                <Section
                  icon={<FaTrophy className="w-5 h-5" />}
                  title={caseStudy.impact.title}
                >
                  <p className="text-primaryDark/70 dark:text-gray-400 mb-8 leading-relaxed">
                    {caseStudy.impact.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {caseStudy.impact.metrics.map((metric, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="text-center p-4 bg-gradient-to-br from-cyan/5 to-primary/5 border border-cyan/20 rounded-xl"
                      >
                        <div className="text-2xl lg:text-3xl font-bold text-cyan mb-1">
                          {metric.value}
                        </div>
                        <div className="text-sm font-medium text-primaryDark dark:text-white">
                          {metric.label}
                        </div>
                        {metric.description && (
                          <div className="text-xs text-primaryDark/50 dark:text-gray-500 mt-1">
                            {metric.description}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </Section>

                {/* Testimonial */}
                {caseStudy.testimonial && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-obsidian via-obsidian-50 to-obsidian border border-primary/20 rounded-2xl p-8"
                  >
                    <FaQuoteLeft className="w-8 h-8 text-cyan/30 mb-4" />
                    <p className="text-lg lg:text-xl text-white font-medium mb-6 leading-relaxed">
                      "{caseStudy.testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-primary flex items-center justify-center text-white font-bold">
                        {caseStudy.testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {caseStudy.testimonial.author}
                        </div>
                        <div className="text-sm text-gray-400">
                          {caseStudy.testimonial.role},{" "}
                          {caseStudy.testimonial.company}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sticky Sidebar (hidden on mobile, shown on desktop) */}
              <div className="hidden lg:block lg:col-span-1">
                {/* Placeholder for additional sidebar content if needed */}
              </div>
            </div>
          </div>
        </section>

        {/* Related Case Studies */}
        <section className="py-16 bg-gradient-to-b from-transparent to-primary/5 dark:to-obsidian-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-primaryDark dark:text-white mb-4">
                More Success Stories
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400">
                Explore other projects we've delivered
              </p>
            </motion.div>

            <RelatedCaseStudies currentSlug={slug} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-cyan/10 to-primary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white mb-4">
                Ready to Start Your Project?
              </h2>
              <p className="text-primaryDark/70 dark:text-gray-400 mb-8">
                Let's discuss how we can help you achieve similar results.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <FloroActionButton href="mailto:contact@gaurav.one?subject=New Project Inquiry">
                  Get in Touch
                  <FaArrowRight className="w-4 h-4 ml-2" />
                </FloroActionButton>
                <PrimaryActionButton href="/domains/casestudy" asLink>
                  View All Case Studies
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
