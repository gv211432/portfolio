"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  whitelabelProducts,
  categoryInfo,
  getHighlightedProducts,
  type ProductCategory,
  type WhitelabelProduct,
} from "@/data/whitelabelProducts";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import DarkModeToggleButton from "@/components/inputs/DarkModeToggleButton";
import { globalConfig, domainUrls } from "@/config/global";
import { Logo } from "@/components/ui";

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
  FaCheck,
  FaStar,
  FaHome,
  FaUserTie,
} from "react-icons/fa";
import { SiKucoin } from "react-icons/si";
import { RiSwapLine } from "react-icons/ri";
import {
  TbArrowsExchange,
  TbChartCandle,
  TbFilter,
  TbLayoutGrid,
  TbList,
} from "react-icons/tb";
import { GiTwoCoins, GiMedicines, GiCardAceSpades } from "react-icons/gi";
import { HiSparkles, HiOutlineExternalLink } from "react-icons/hi";

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  SiKucoin: <SiKucoin className="w-8 h-8" />,
  TbArrowsExchange: <TbArrowsExchange className="w-8 h-8" />,
  SiUniswap: <RiSwapLine className="w-8 h-8" />,
  FaTelegram: <FaTelegram className="w-8 h-8" />,
  GiTwoCoins: <GiTwoCoins className="w-8 h-8" />,
  TbChartCandle: <TbChartCandle className="w-8 h-8" />,
  FaInstagram: <FaInstagram className="w-8 h-8" />,
  FaMedium: <FaMedium className="w-8 h-8" />,
  GiMedicines: <GiMedicines className="w-8 h-8" />,
  FaParking: <FaParking className="w-8 h-8" />,
  FaCoins: <FaCoins className="w-8 h-8" />,
  FaBuilding: <FaBuilding className="w-8 h-8" />,
  FaBitcoin: <FaBitcoin className="w-8 h-8" />,
  FaHome: <FaHome className="w-8 h-8" />,
  FaUserTie: <FaUserTie className="w-8 h-8" />,
  GiCardAceSpades: <GiCardAceSpades className="w-8 h-8" />,
};

const categories: { key: ProductCategory | "all"; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "defi", label: "DeFi" },
  { key: "trading", label: "Trading" },
  { key: "blockchain", label: "Blockchain" },
  { key: "social", label: "Social" },
  { key: "automation", label: "Automation" },
  { key: "enterprise", label: "Enterprise" },
  { key: "iot", label: "IoT" },
];

// Product Card Component
const ProductCard = ({
  product,
  index,
  viewMode,
}: {
  product: WhitelabelProduct;
  index: number;
  viewMode: "grid" | "list";
}) => {
  const catInfo = categoryInfo[product.category];

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        <Link href={`/products/${product.slug}`}>
          <div className="group bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan/5">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center text-white shadow-lg`}
              >
                {iconMap[product.icon]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-primaryDark dark:text-white group-hover:text-cyan transition-colors truncate">
                    {product.title}
                  </h3>
                  {product.highlighted && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-cyan/10 border border-cyan/30 rounded-full text-cyan text-xs font-medium">
                      <FaStar className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-primaryDark/60 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${catInfo.bgColor} ${catInfo.color}`}
                  >
                    {catInfo.label}
                  </span>
                  <span className="text-primaryDark/50 dark:text-gray-500 text-sm">
                    From {product.pricing.startingFrom}
                  </span>
                  <div className="flex items-center gap-2 text-primaryDark/40 dark:text-gray-600 text-xs">
                    {product.techStack.slice(0, 3).map((tech) => (
                      <span key={tech} className="px-2 py-0.5 bg-primary/10 rounded">
                        {tech}
                      </span>
                    ))}
                    {product.techStack.length > 3 && (
                      <span className="text-primary">
                        +{product.techStack.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 self-center">
                <FaArrowRight className="w-5 h-5 text-primary/30 group-hover:text-cyan group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/products/${product.slug}`}>
        <div className="group h-full bg-light dark:bg-obsidian-50 border border-primary/20 hover:border-cyan/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan/10 hover:-translate-y-1">
          {/* Hero Image Placeholder */}
          <div className="relative h-48 overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-90`}
            />
            <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/90 transform group-hover:scale-110 transition-transform duration-300 [&>svg]:w-16 [&>svg]:h-16">
                {iconMap[product.icon]}
              </div>
            </div>
            {product.highlighted && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-obsidian/80 backdrop-blur-sm rounded-full text-cyan text-xs font-semibold">
                <HiSparkles className="w-3.5 h-3.5" />
                Featured
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-obsidian/50 ${catInfo.color} border-white/20`}
              >
                {catInfo.label}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-primaryDark dark:text-white mb-2 group-hover:text-cyan transition-colors">
              {product.shortTitle}
            </h3>
            <p className="text-sm text-primary dark:text-cyan/80 font-medium mb-3">
              {product.tagline}
            </p>
            <p className="text-primaryDark/60 dark:text-gray-400 text-sm mb-4 line-clamp-3">
              {product.description}
            </p>

            {/* Stats */}
            {product.stats && (
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-primary/10">
                {product.stats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-lg font-bold text-cyan">{stat.value}</div>
                    <div className="text-xs text-primaryDark/50 dark:text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-primaryDark/70 dark:text-gray-400">
                From{" "}
                <span className="font-semibold text-primaryDark dark:text-white">
                  {product.pricing.startingFrom}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-cyan text-sm font-medium group-hover:gap-2 transition-all">
                Learn more
                <FaArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Stats Section Component
const StatsSection = () => {
  const stats = [
    { value: "13+", label: "Products" },
    { value: "$500K+", label: "Total Revenue Generated" },
    { value: "50+", label: "Deployments" },
    { value: "24/7", label: "Support" },
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

// Featured Products Carousel
const FeaturedCarousel = () => {
  const featured = getHighlightedProducts();

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white">
            Featured Products
          </h2>
          <p className="text-primaryDark/60 dark:text-gray-400 mt-2">
            Our most popular and battle-tested solutions
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Link href={`/products/${product.slug}`}>
              <div className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${product.gradient}`}
                />
                <div className="absolute inset-0 bg-obsidian/40 group-hover:bg-obsidian/20 transition-colors" />
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <div className="text-white/90">
                      {iconMap[product.icon]}
                    </div>
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      {categoryInfo[product.category].label}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {product.shortTitle}
                    </h3>
                    <p className="text-white/80 text-sm mb-3">{product.tagline}</p>
                    <span className="inline-flex items-center gap-1 text-white text-sm font-medium group-hover:gap-2 transition-all">
                      Explore
                      <FaArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function WhitelabelPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">(
    "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { darkMode } = useDarkModeStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const filteredProducts = whitelabelProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-secondary dark:bg-obsidian transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="lg" href={domainUrls.root} />

            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href={domainUrls.root}
                className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="#products"
                className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium"
              >
                Products
              </Link>
              <Link
                href={domainUrls.casestudy}
                className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium"
              >
                Case Studies
              </Link>
              <Link
                href={domainUrls.blogs}
                className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors font-medium"
              >
                Blog
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <DarkModeToggleButton />
              <a
                href={`mailto:${globalConfig.email}?subject=Whitelabel Product Inquiry`}
                className="hidden lg:inline-flex bg-gradient-to-r from-cyan to-cyan-600 hover:from-cyan-600 hover:to-cyan text-obsidian px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-cyan/20"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 relative overflow-hidden">
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
              <HiSparkles className="w-4 h-4" />
              White-Label Solutions
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-primaryDark dark:text-white leading-tight mb-6">
              Launch Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary font-cinzel font-black">
                Product
              </span>{" "}
              in Days, Not Months
            </h1>
            <p className="text-lg lg:text-xl text-primaryDark/70 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Battle-tested white-label solutions for DeFi, trading platforms,
              social tools, and enterprise software. Your brand, our technology.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#products"
                className="bg-gradient-to-r from-cyan to-cyan-600 hover:from-cyan-600 hover:to-cyan text-obsidian px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-xl hover:shadow-cyan/20"
              >
                Browse Products
              </a>
              <a
                href={`mailto:${globalConfig.email}?subject=Custom Solution Inquiry`}
                className="border-2 border-primary/50 text-primary hover:bg-primary/10 px-8 py-4 rounded-lg font-semibold transition-all"
              >
                Request Custom Build
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Main Products Section */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Carousel */}
          <FeaturedCarousel />

          {/* All Products Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-primaryDark dark:text-white">
                All Products
              </h2>
              <p className="text-primaryDark/60 dark:text-gray-400 mt-2">
                {filteredProducts.length} solutions available
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 pl-10 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-lg text-primaryDark dark:text-white placeholder-primaryDark/40 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 transition-colors"
                />
                <TbFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primaryDark/40 dark:text-gray-500" />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 p-1 bg-light dark:bg-obsidian-50 border border-primary/20 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-cyan/20 text-cyan"
                      : "text-primaryDark/50 dark:text-gray-500 hover:text-primaryDark dark:hover:text-white"
                  }`}
                >
                  <TbLayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-cyan/20 text-cyan"
                      : "text-primaryDark/50 dark:text-gray-500 hover:text-primaryDark dark:hover:text-white"
                  }`}
                >
                  <TbList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === cat.key
                    ? "bg-cyan text-obsidian"
                    : "bg-light dark:bg-obsidian-50 border border-primary/20 text-primaryDark/70 dark:text-gray-400 hover:border-cyan/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Products Grid/List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${viewMode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-primaryDark/60 dark:text-gray-400 text-lg">
                No products found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-cyan hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
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
              Need a Custom Solution?
            </h2>
            <p className="text-primaryDark/70 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Don't see exactly what you need? We build custom white-label
              solutions tailored to your specific requirements.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`mailto:${globalConfig.email}?subject=Custom White-label Solution`}
                className="bg-gradient-to-r from-primary to-primaryDark hover:from-primaryDark hover:to-primary text-white px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-xl hover:shadow-primary/20 flex items-center gap-2"
              >
                Discuss Your Project
                <FaArrowRight className="w-4 h-4" />
              </a>
              <Link
                href={domainUrls.casestudy}
                className="border-2 border-primary/50 text-primary hover:bg-primary/10 px-8 py-4 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                View Case Studies
                <HiOutlineExternalLink className="w-4 h-4" />
              </Link>
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
                <Logo size="lg" href={domainUrls.root} />
              </div>
              <p className="text-primaryDark/70 dark:text-gray-400 mb-6 max-w-md">
                White-label solutions for the next generation of digital
                products. From DeFi protocols to enterprise software, we build
                and you brand.
              </p>
              <div className="flex gap-4">
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

            <div>
              <h4 className="text-primaryDark dark:text-white font-semibold mb-6">
                Categories
              </h4>
              <ul className="space-y-3">
                {categories.slice(1).map((cat) => (
                  <li key={cat.key}>
                    <button
                      onClick={() => setSelectedCategory(cat.key)}
                      className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-primaryDark dark:text-white font-semibold mb-6">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={domainUrls.root}
                    className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href={domainUrls.casestudy}
                    className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href={domainUrls.blogs}
                    className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <a
                    href={`mailto:${globalConfig.email}`}
                    className="text-primaryDark/70 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary/10 mt-12 pt-8 text-center">
            <p className="text-primaryDark/70 dark:text-gray-400">
              © {new Date().getFullYear()} Gaurav.one. White-label solutions for
              the digital age.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
