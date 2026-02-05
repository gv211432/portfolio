"use client";
import React, { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  getProductBySlug,
  categoryInfo,
  whitelabelProducts,
  type WhitelabelProduct,
} from "@/data/whitelabelProducts";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { globalConfig, domainUrls } from "@/config/global";
import {
  Logo,
  FloroActionButton,
  PrimaryActionButton,
} from "@/components/ui";

// React Icons imports
import {
  FaTelegram,
  FaInstagram,
  FaMedium,
  FaParking,
  FaCoins,
  FaBuilding,
  FaBitcoin,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaUsers,
  FaCog,
  FaCode,
  FaPlug,
  FaQuoteLeft,
  FaHome,
  FaUserTie,
} from "react-icons/fa";
import { SiKucoin } from "react-icons/si";
import { RiSwapLine } from "react-icons/ri";
import { TbArrowsExchange, TbChartCandle } from "react-icons/tb";
import { GiTwoCoins, GiMedicines, GiCardAceSpades } from "react-icons/gi";
import { HiSparkles, HiOutlineExternalLink } from "react-icons/hi";
import { BsLightningCharge, BsShieldCheck, BsGraphUp } from "react-icons/bs";

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  SiKucoin: <SiKucoin className="w-12 h-12" />,
  TbArrowsExchange: <TbArrowsExchange className="w-12 h-12" />,
  SiUniswap: <RiSwapLine className="w-12 h-12" />,
  FaTelegram: <FaTelegram className="w-12 h-12" />,
  GiTwoCoins: <GiTwoCoins className="w-12 h-12" />,
  TbChartCandle: <TbChartCandle className="w-12 h-12" />,
  FaInstagram: <FaInstagram className="w-12 h-12" />,
  FaMedium: <FaMedium className="w-12 h-12" />,
  GiMedicines: <GiMedicines className="w-12 h-12" />,
  FaParking: <FaParking className="w-12 h-12" />,
  FaCoins: <FaCoins className="w-12 h-12" />,
  FaBuilding: <FaBuilding className="w-12 h-12" />,
  FaBitcoin: <FaBitcoin className="w-12 h-12" />,
  FaHome: <FaHome className="w-12 h-12" />,
  FaUserTie: <FaUserTie className="w-12 h-12" />,
  GiCardAceSpades: <GiCardAceSpades className="w-12 h-12" />,
};

// Feature Section Component
const FeatureSection = ({
  title,
  icon,
  features,
  gradient,
}: {
  title: string;
  icon: React.ReactNode;
  features: string[];
  gradient: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-light dark:bg-obsidian-50 border border-primary/20 rounded-2xl p-8"
    >
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-primaryDark dark:text-white">
          {title}
        </h3>
      </div>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 mt-0.5 bg-cyan/20 rounded-full flex items-center justify-center">
              <FaCheck className="w-3 h-3 text-cyan" />
            </span>
            <span className="text-primaryDark/70 dark:text-gray-400">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// Screenshot Gallery Component
const ScreenshotGallery = ({ screenshots }: { screenshots: string[] }) => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {screenshots.map((screenshot, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="group relative aspect-video rounded-xl overflow-hidden bg-primary/10 border border-primary/20"
        >
          {/* Placeholder for actual images */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-cyan/20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <BsGraphUp className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-primary/60 text-sm font-medium">
                Screenshot {index + 1}
              </p>
              <p className="text-primary/40 text-xs mt-1">Coming Soon</p>
            </div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white font-medium">View Full Size</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Related Products Component
const RelatedProducts = ({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: string;
}) => {
  const related = whitelabelProducts
    .filter((p) => p.slug !== currentSlug && p.category === category)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="py-16 border-t border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primaryDark dark:text-white mb-8">
          Related Products
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {related.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/products/${product.slug}`}>
                <div className="group bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center text-white mb-4 [&>svg]:w-6 [&>svg]:h-6`}
                  >
                    {iconMap[product.icon]}
                  </div>
                  <h3 className="text-lg font-bold text-primaryDark dark:text-white mb-2 group-hover:text-cyan transition-colors">
                    {product.shortTitle}
                  </h3>
                  <p className="text-sm text-primaryDark/60 dark:text-gray-400 line-clamp-2">
                    {product.tagline}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { darkMode } = useDarkModeStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-secondary dark:bg-obsidian flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primaryDark dark:text-white mb-4">
            Product Not Found
          </h1>
          <p className="text-primaryDark/60 dark:text-gray-400 mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan hover:underline"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const catInfo = categoryInfo[product.category];

  return (
    <div className="min-h-screen bg-secondary dark:bg-obsidian transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-primaryDark/60 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-6 w-px bg-primary/20" />
              <Logo size="lg" href={domainUrls.root} />
            </div>

            <div className="flex items-center gap-4">
              <FloroActionButton
                href={`mailto:${globalConfig.email}?subject=Inquiry: ${product.title}`}
                className="hidden sm:inline-flex px-6 py-2.5"
              >
                Get This Product
              </FloroActionButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-light to-secondary dark:from-obsidian dark:via-obsidian-50 dark:to-obsidian transition-colors duration-300" />
        <div
          className={`absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br ${product.gradient} opacity-10 rounded-full blur-[120px]`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm mb-6">
                <Link
                  href="/"
                  className="text-primaryDark/60 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  Products
                </Link>
                <span className="text-primaryDark/40 dark:text-gray-600">/</span>
                <span
                  className={`${catInfo.color} font-medium`}
                >
                  {catInfo.label}
                </span>
              </div>

              {/* Category Badge */}
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 border ${catInfo.bgColor} ${catInfo.color}`}
              >
                {product.highlighted && <HiSparkles className="w-4 h-4" />}
                {catInfo.label}
              </span>

              <h1 className="text-4xl lg:text-5xl font-bold text-primaryDark dark:text-white leading-tight mb-4">
                {product.title}
              </h1>

              <p className="text-xl text-primary dark:text-cyan font-medium mb-4">
                {product.tagline}
              </p>

              <p className="text-lg text-primaryDark/70 dark:text-gray-400 mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Stats */}
              {product.stats && (
                <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-primary/10">
                  {product.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary">
                        {stat.value}
                      </div>
                      <div className="text-sm text-primaryDark/60 dark:text-gray-500">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing */}
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div>
                  <p className="text-sm text-primaryDark/60 dark:text-gray-500 mb-1">
                    Pricing Model
                  </p>
                  <p className="text-lg font-semibold text-primaryDark dark:text-white">
                    {product.pricing.model}
                  </p>
                </div>
                {product.pricing.startingFrom && (
                  <div>
                    <p className="text-sm text-primaryDark/60 dark:text-gray-500 mb-1">
                      Starting From
                    </p>
                    <p className="text-2xl font-bold text-cyan">
                      {product.pricing.startingFrom}
                    </p>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <FloroActionButton
                  href={`mailto:${globalConfig.email}?subject=Inquiry: ${product.title}&body=Hi, I'm interested in the ${product.title} white-label solution. Please share more details about pricing and implementation.`}
                >
                  Request Demo
                  <FaArrowRight className="w-4 h-4 ml-2" />
                </FloroActionButton>
                <PrimaryActionButton
                  href={`mailto:${globalConfig.email}?subject=Custom Quote: ${product.title}`}
                >
                  Get Custom Quote
                </PrimaryActionButton>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div
                className={`aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br ${product.gradient} p-1`}
              >
                <div className="w-full h-full rounded-3xl bg-light dark:bg-obsidian flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-10" />
                  <div className="relative text-center">
                    <div className="text-white/90 mb-6 [&>svg]:w-24 [&>svg]:h-24 [&>svg]:mx-auto" style={{ filter: "drop-shadow(0 0 30px rgba(0, 217, 255, 0.3))" }}>
                      {iconMap[product.icon]}
                    </div>
                    <h3 className="text-2xl font-bold text-primaryDark dark:text-white mb-2">
                      {product.shortTitle}
                    </h3>
                    <p className="text-primaryDark/60 dark:text-gray-400">
                      White-Label Solution
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -top-4 -right-4 px-4 py-2 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <BsShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-primaryDark dark:text-white">
                    Battle-Tested
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 px-4 py-2 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <BsLightningCharge className="w-5 h-5 text-cyan" />
                  <span className="text-sm font-medium text-primaryDark dark:text-white">
                    Quick Deploy
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-light/50 dark:bg-obsidian-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
              Product Features
            </h2>
            <p className="text-primaryDark/60 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to launch and scale your white-label solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureSection
              title="Core Features"
              icon={<BsLightningCharge className="w-6 h-6" />}
              features={product.features}
              gradient={product.gradient}
            />
            <FeatureSection
              title="User Features"
              icon={<FaUsers className="w-6 h-6" />}
              features={product.userFeatures}
              gradient="from-cyan to-blue-600"
            />
            <FeatureSection
              title="Admin Features"
              icon={<FaCog className="w-6 h-6" />}
              features={product.adminFeatures}
              gradient="from-purple-500 to-violet-600"
            />
          </div>
        </div>
      </section>

      {/* Tech Stack & Integrations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <FaCode className="w-6 h-6 text-cyan" />
                <h3 className="text-2xl font-bold text-primaryDark dark:text-white">
                  Tech Stack
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-lg text-primaryDark dark:text-white font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Integrations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <FaPlug className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-primaryDark dark:text-white">
                  Integrations
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.integrations.map((integration) => (
                  <span
                    key={integration}
                    className="px-4 py-2 bg-gradient-to-r from-primary/10 to-cyan/10 border border-primary/20 rounded-lg text-primaryDark dark:text-white font-medium"
                  >
                    {integration}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Screenshots */}
      <section className="py-16 bg-light/50 dark:bg-obsidian-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
              Product Screenshots
            </h2>
            <p className="text-primaryDark/60 dark:text-gray-400">
              Preview of the user interface and admin panels
            </p>
          </div>
          <ScreenshotGallery screenshots={product.screenshots} />
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primaryDark dark:text-white mb-4">
              Ideal Use Cases
            </h2>
            <p className="text-primaryDark/60 dark:text-gray-400">
              Perfect for these business scenarios
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-xl"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-cyan/10 rounded-full flex items-center justify-center">
                  <FaCheck className="w-5 h-5 text-cyan" />
                </div>
                <p className="font-semibold text-primaryDark dark:text-white">
                  {useCase}
                </p>
              </motion.div>
            ))}
          </div>
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
            <FaQuoteLeft className="w-12 h-12 text-primary/30 mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark dark:text-white mb-6">
              Ready to Launch {product.shortTitle}?
            </h2>
            <p className="text-primaryDark/70 dark:text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
              Get started with a personalized demo and custom quote for your
              business needs. Our team will help you understand the full
              potential of this solution.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <FloroActionButton
                href={`mailto:${globalConfig.email}?subject=Demo Request: ${product.title}&body=Hi, I'd like to schedule a demo for the ${product.title} white-label solution.`}
              >
                Schedule Demo
                <FaArrowRight className="w-4 h-4 ml-2" />
              </FloroActionButton>
              <PrimaryActionButton href="/" asLink>
                View All Products
                <HiOutlineExternalLink className="w-4 h-4 ml-2" />
              </PrimaryActionButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Products */}
      <RelatedProducts currentSlug={slug} category={product.category} />

      {/* Footer */}
      <footer className="bg-light dark:bg-obsidian border-t border-primary/10 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Logo size="lg" href={domainUrls.root} />
              <span className="text-primaryDark/40 dark:text-gray-600">|</span>
              <span className="text-primaryDark/60 dark:text-gray-400">
                White-Label Solutions
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={globalConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaGithub className="w-5 h-5 text-primary" />
              </a>
              <a
                href={globalConfig.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaLinkedin className="w-5 h-5 text-primary" />
              </a>
              <a
                href={globalConfig.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-secondary dark:bg-obsidian-50 hover:bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaTwitter className="w-5 h-5 text-primary" />
              </a>
            </div>
          </div>

          <div className="border-t border-primary/10 mt-8 pt-8 text-center">
            <p className="text-primaryDark/60 dark:text-gray-500 text-sm">
              © {new Date().getFullYear()} Gaurav.one. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
