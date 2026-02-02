"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkModeStore } from "@/Atoms/globalAtoms";

const impactStats = [
  { number: "15+", label: "Projects Delivered", icon: "🌐" },
  { number: "50K+", label: "Lives Impacted", icon: "💚" },
  { number: "100%", label: "Free Development", icon: "✨" },
  { number: "24/7", label: "Support Provided", icon: "🤝" },
];

const showcaseProjects = [
  {
    name: "Nandgaonkar Foundation",
    subdomain: "nandgaonkar",
    description: "Empowering rural communities through education and healthcare initiatives.",
    category: "Education & Health",
    status: "Live",
  },
  {
    name: "Fight For Right",
    subdomain: "fightforright",
    description: "Legal aid and advocacy for underprivileged communities seeking justice.",
    category: "Legal Aid",
    status: "Live",
  },
  {
    name: "Green Earth Initiative",
    subdomain: "greenearth",
    description: "Environmental conservation and sustainable development programs.",
    category: "Environment",
    status: "In Development",
  },
  {
    name: "Skill India Foundation",
    subdomain: "skillindia",
    description: "Vocational training and employment opportunities for youth.",
    category: "Skill Development",
    status: "Live",
  },
];

// Raw markdown for copy functionality
const applicationTemplateRaw = `## Website/App Details Template

### Basic Information
- Organization Name: [Your NGO/Community Name]
- Website Name: [Preferred subdomain - e.g., yourorg.myorg.in]
- Tagline: [A short, memorable phrase]

### Brand Identity
- Logo: [Attach or describe - we can help create one]
- Primary Color: [e.g., #2E8B57 or "forest green"]
- Secondary Color: [e.g., #F0F0F0 or "light gray"]
- Font Preference: [Modern/Classic/Playful]

### Purpose & Goals
- Primary Purpose: [e.g., Donations, Awareness, Volunteer Recruitment]
- Target Audience: [Who will visit your site?]
- Key Message: [What should visitors understand/feel?]

### Required Pages
- [ ] Home Page
- [ ] About Us
- [ ] Our Work/Projects
- [ ] Donate/Support
- [ ] Contact Us
- [ ] Gallery/Media
- [ ] Other: ___________

### Features Needed
- [ ] Donation Integration (Razorpay/PayPal)
- [ ] Volunteer Registration Form
- [ ] Newsletter Subscription
- [ ] Blog/News Section
- [ ] Event Calendar
- [ ] Social Media Integration
- [ ] Multi-language Support
- [ ] Other: ___________

### Content
- Do you have content ready? [Yes/No/Partial]
- Do you have images/media? [Yes/No/Need help]

### Reference Websites
- [List 2-3 websites you like and why]

### Additional Notes
- [Any specific requirements or preferences]`;

// Formatted template component
const ApplicationTemplate = () => (
  <div className="space-y-6 text-sm">
    {/* Basic Information */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">1</span>
        Basic Information
      </h3>
      <div className="space-y-2 pl-8">
        <p><span className="text-[#0F5132] dark:text-white font-medium">Organization Name:</span> <span className="text-gray-500 dark:text-gray-400">[Your NGO/Community Name]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Website Name:</span> <span className="text-gray-500 dark:text-gray-400">[Preferred subdomain - e.g., yourorg.myorg.in]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Tagline:</span> <span className="text-gray-500 dark:text-gray-400">[A short, memorable phrase]</span></p>
      </div>
    </div>

    {/* Brand Identity */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">2</span>
        Brand Identity
      </h3>
      <div className="space-y-2 pl-8">
        <p><span className="text-[#0F5132] dark:text-white font-medium">Logo:</span> <span className="text-gray-500 dark:text-gray-400">[Attach or describe - we can help create one]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Primary Color:</span> <span className="text-gray-500 dark:text-gray-400">[e.g., #2E8B57 or "forest green"]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Secondary Color:</span> <span className="text-gray-500 dark:text-gray-400">[e.g., #F0F0F0 or "light gray"]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Font Preference:</span> <span className="text-gray-500 dark:text-gray-400">[Modern/Classic/Playful]</span></p>
      </div>
    </div>

    {/* Purpose & Goals */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">3</span>
        Purpose & Goals
      </h3>
      <div className="space-y-2 pl-8">
        <p><span className="text-[#0F5132] dark:text-white font-medium">Primary Purpose:</span> <span className="text-gray-500 dark:text-gray-400">[e.g., Donations, Awareness, Volunteer Recruitment]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Target Audience:</span> <span className="text-gray-500 dark:text-gray-400">[Who will visit your site?]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Key Message:</span> <span className="text-gray-500 dark:text-gray-400">[What should visitors understand/feel?]</span></p>
      </div>
    </div>

    {/* Required Pages */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">4</span>
        Required Pages
      </h3>
      <div className="grid grid-cols-2 gap-2 pl-8">
        {["Home Page", "About Us", "Our Work/Projects", "Donate/Support", "Contact Us", "Gallery/Media", "Other: ___"].map((page) => (
          <label key={page} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-4 h-4 border border-[#198754]/50 rounded flex-shrink-0" />
            {page}
          </label>
        ))}
      </div>
    </div>

    {/* Features Needed */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">5</span>
        Features Needed
      </h3>
      <div className="grid grid-cols-2 gap-2 pl-8">
        {["Donation Integration (Razorpay/PayPal)", "Volunteer Registration Form", "Newsletter Subscription", "Blog/News Section", "Event Calendar", "Social Media Integration", "Multi-language Support", "Other: ___"].map((feature) => (
          <label key={feature} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="w-4 h-4 border border-[#198754]/50 rounded flex-shrink-0" />
            {feature}
          </label>
        ))}
      </div>
    </div>

    {/* Content */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">6</span>
        Content
      </h3>
      <div className="space-y-2 pl-8">
        <p><span className="text-[#0F5132] dark:text-white font-medium">Do you have content ready?</span> <span className="text-gray-500 dark:text-gray-400">[Yes/No/Partial]</span></p>
        <p><span className="text-[#0F5132] dark:text-white font-medium">Do you have images/media?</span> <span className="text-gray-500 dark:text-gray-400">[Yes/No/Need help]</span></p>
      </div>
    </div>

    {/* Reference Websites */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">7</span>
        Reference Websites
      </h3>
      <p className="text-gray-500 dark:text-gray-400 pl-8">[List 2-3 websites you like and why]</p>
    </div>

    {/* Additional Notes */}
    <div>
      <h3 className="text-[#198754] dark:text-[#20c997] font-semibold text-base mb-3 flex items-center gap-2">
        <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center text-xs">8</span>
        Additional Notes
      </h3>
      <p className="text-gray-500 dark:text-gray-400 pl-8">[Any specific requirements or preferences]</p>
    </div>
  </div>
);

export default function NgoPage() {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    impact: "",
    timeline: false,
  });
  const { darkMode, toggleDarkMode } = useDarkModeStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0A3622] dark:via-[#0F5132] dark:to-[#0A3622]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0A3622]/95 backdrop-blur-sm border-b border-[#198754]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌱</span>
              <div>
                <span className="text-xl font-bold text-[#0F5132] dark:text-white">
                  my<span className="text-[#20c997]">Org</span>.in
                </span>
                <p className="text-xs text-[#198754] dark:text-[#20c997]/70">Free Development for Impact</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#mission" className="text-gray-600 dark:text-gray-300 hover:text-[#20c997] transition-colors">
                Mission
              </a>
              <a href="#apply" className="text-gray-600 dark:text-gray-300 hover:text-[#20c997] transition-colors">
                Apply
              </a>
              <a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-[#20c997] transition-colors">
                Projects
              </a>
              <a href="#impact" className="text-gray-600 dark:text-gray-300 hover:text-[#20c997] transition-colors">
                Impact
              </a>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-gray-100 dark:bg-[#0F5132] hover:bg-gray-200 dark:hover:bg-[#198754]/50 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#0F5132]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <a
                href="#apply"
                className="bg-[#20c997] hover:bg-[#1abc9c] text-white dark:text-[#0A3622] px-5 py-2 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-[#20c997]/20"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Decorative elements - Blinking blur circles */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#20c997]/20 dark:bg-[#20c997]/10 rounded-full blur-3xl"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-[#198754]/20 dark:bg-[#198754]/10 rounded-full blur-3xl"
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-48 h-48 bg-[#20c997]/15 dark:bg-[#20c997]/8 rounded-full blur-3xl"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#20c997]/10 border border-[#20c997]/30 rounded-full text-[#20c997] text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#20c997] rounded-full animate-pulse" />
              Now Accepting Applications
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#0F5132] dark:text-white leading-tight mb-6">
              Empowering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#20c997] to-[#198754]">
                Change Makers
              </span>
              <br />
              With Free Development
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Are you an <span className="text-[#198754] dark:text-[#20c997] font-semibold">open-source project</span>,{" "}
              <span className="text-[#198754] dark:text-[#20c997] font-semibold">community initiative</span>, or{" "}
              <span className="text-[#198754] dark:text-[#20c997] font-semibold">NGO with limited capital</span> but a
              vision for higher impact? Think no further.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#apply"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#20c997] to-[#198754] hover:from-[#1abc9c] hover:to-[#157347] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl hover:shadow-[#20c997]/30 hover:scale-105"
              >
                <span>Apply for Free Development</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="#projects"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#198754] dark:border-[#20c997]/50 text-[#198754] dark:text-[#20c997] hover:bg-[#20c997]/10 px-8 py-4 rounded-full font-semibold text-lg transition-all"
              >
                View Our Work
              </a>
            </div>
          </motion.div>

          {/* Stats Cards - with levitating animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {impactStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3,
                }}
                className="bg-white dark:bg-[#0F5132]/50 backdrop-blur-sm border border-[#198754]/30 rounded-2xl p-6 text-center hover:border-[#20c997]/50 transition-all hover:scale-105 shadow-lg dark:shadow-none"
              >
                <span className="text-3xl mb-2 block">{stat.icon}</span>
                <div className="text-3xl md:text-4xl font-bold text-[#198754] dark:text-[#20c997] mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 bg-[#f0fdf4] dark:bg-[#0A3622]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-[#198754] dark:text-[#20c997] font-semibold uppercase tracking-wider text-sm">
                Our Mission
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-white mt-4 mb-6">
                Bridging the Gap Between{" "}
                <span className="text-[#198754] dark:text-[#20c997]">Vision and Technology</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We believe that lack of technical resources should never be a barrier to creating
                positive change. Our mission is to provide professional-grade web development
                services completely free to organizations that are making a real difference in
                society.
              </p>
              <ul className="space-y-4">
                {[
                  "100% Free Development - No hidden costs, ever",
                  "Professional Quality - Same standards as paid projects",
                  "Ongoing Support - We don't just build and leave",
                  "Your Subdomain - yourorg.myorg.in ready to go",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#20c997]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-[#198754] dark:text-[#20c997]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white dark:bg-[#0F5132]/80 dark:backdrop-blur-sm rounded-3xl p-8 border border-[#198754]/30 dark:border-[#20c997]/30 shadow-xl dark:shadow-[#20c997]/5">
                <div className="text-center mb-8">
                  <span className="text-6xl">🎯</span>
                  <h3 className="text-2xl font-bold text-[#0F5132] dark:text-white mt-4">Who Can Apply?</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: "🏛️", title: "Registered NGOs", desc: "Working for social causes" },
                    {
                      icon: "🌍",
                      title: "Community Initiatives",
                      desc: "Local or global impact projects",
                    },
                    {
                      icon: "💻",
                      title: "Open Source Projects",
                      desc: "Building for the community",
                    },
                    {
                      icon: "🎓",
                      title: "Educational Institutions",
                      desc: "Non-profit schools & colleges",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 p-4 bg-[#f0fdf4] dark:bg-[#0A3622] rounded-xl border border-[#198754]/20 dark:border-[#20c997]/20 hover:border-[#20c997]/40 dark:hover:border-[#20c997]/60 transition-all"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="text-[#0F5132] dark:text-[#20c997] font-semibold">{item.title}</h4>
                        <p className="text-gray-500 dark:text-gray-300 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#20c997]/20 dark:bg-[#20c997]/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#198754]/20 dark:bg-[#198754]/30 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section id="apply" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#198754] dark:text-[#20c997] font-semibold uppercase tracking-wider text-sm">
              Get Started
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-white mt-4 mb-4">
              3 Simple Steps to Your Free Website
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Our streamlined application process ensures we understand your vision and can deliver
              exactly what you need.
            </p>
          </motion.div>

          {/* Steps Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4 md:gap-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(step)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      activeStep >= step
                        ? "bg-[#20c997] text-[#0A3622]"
                        : "bg-gray-100 dark:bg-[#0F5132] text-gray-400 border border-[#198754]/30"
                    }`}
                  >
                    {step}
                  </button>
                  {step < 3 && (
                    <div
                      className={`hidden md:block w-16 lg:w-24 h-1 mx-2 rounded ${
                        activeStep > step ? "bg-[#20c997]" : "bg-gray-200 dark:bg-[#0F5132]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white dark:bg-[#0F5132]/30 backdrop-blur-sm rounded-3xl border border-[#198754]/30 p-8 md:p-12 shadow-xl dark:shadow-none">
              {/* Step 1 */}
              <AnimatePresence mode="wait">
                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-4xl">📝</span>
                      <div>
                        <h3 className="text-2xl font-bold text-[#0F5132] dark:text-white">
                          Step 1: Describe Your Project
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Tell us about your website/app in detail
                        </p>
                      </div>
                    </div>

                    {/* Collapsible Template */}
                    <div className="mb-8">
                      <button
                        onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                        className="flex items-center gap-3 w-full p-4 bg-[#f0fdf4] dark:bg-[#0A3622]/50 rounded-xl border border-[#198754]/30 hover:border-[#20c997]/50 transition-all text-left"
                      >
                        <motion.svg
                          animate={{ rotate: isTemplateOpen ? 180 : 0 }}
                          className="w-5 h-5 text-[#20c997]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                        <div>
                          <span className="text-[#0F5132] dark:text-white font-medium">
                            View Example Template (Optional)
                          </span>
                          <p className="text-gray-500 text-sm">
                            Use this template to structure your description
                          </p>
                        </div>
                        <span className="ml-auto text-[#20c997] text-sm">
                          {isTemplateOpen ? "Hide" : "Show"}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isTemplateOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-6 bg-[#f0fdf4] dark:bg-[#0A3622] rounded-xl border border-[#198754]/20">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-[#20c997] font-medium">
                                  Application Template
                                </span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(applicationTemplateRaw)}
                                  className="text-sm text-gray-400 hover:text-[#20c997] transition-colors flex items-center gap-1"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copy
                                </button>
                              </div>
                              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                <ApplicationTemplate />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                            Organization Name *
                          </label>
                          <input
                            type="text"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleInputChange}
                            placeholder="e.g., Green Earth Foundation"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                            Preferred Subdomain *
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              placeholder="yourorg"
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-l-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all"
                            />
                            <span className="px-4 py-3 bg-[#f0fdf4] dark:bg-[#198754]/20 border border-l-0 border-[#198754]/30 rounded-r-xl text-[#198754] dark:text-[#20c997] font-medium">
                              .myorg.in
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="contact@yourorg.com"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                          Project Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={6}
                          placeholder="Describe your organization, the website you need, key features, target audience, and any specific requirements. You can use the template above as a guide."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="inline-flex items-center gap-2 bg-[#20c997] hover:bg-[#1abc9c] text-[#0A3622] px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
                      >
                        Continue to Step 2
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 */}
                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-4xl">🌍</span>
                      <div>
                        <h3 className="text-2xl font-bold text-[#0F5132] dark:text-white">Step 2: Share Your Impact</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Tell us why you're applying and the impact you'll create
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-gray-600 dark:text-gray-300 mb-2 font-medium">
                          Why are you applying for free development? *
                        </label>
                        <textarea
                          name="impact"
                          value={formData.impact}
                          onChange={handleInputChange}
                          rows={8}
                          placeholder="Share your story:

• What is your organization's mission?
• Why do you need a website/app?
• What impact will this create on society?
• How many people will this help?
• What challenges are you facing without proper digital presence?

Be specific about the positive change this will enable."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A3622] border border-[#198754]/30 rounded-xl text-[#0F5132] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#20c997] focus:ring-1 focus:ring-[#20c997] outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="bg-[#f0fdf4] dark:bg-[#0A3622]/50 rounded-xl p-6 border border-[#198754]/20">
                        <h4 className="text-[#0F5132] dark:text-white font-semibold mb-4 flex items-center gap-2">
                          <span className="text-xl">💡</span> Tips for a Strong Application
                        </h4>
                        <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-[#20c997]">•</span>
                            Be specific about your target beneficiaries and their needs
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#20c997]">•</span>
                            Include any metrics or goals (e.g., "help 500 students access education")
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#20c997]">•</span>
                            Explain how a website will amplify your existing efforts
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#20c997]">•</span>
                            Share any partnerships or recognitions your organization has received
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveStep(1)}
                        className="inline-flex items-center gap-2 border border-[#198754]/50 text-gray-600 dark:text-gray-300 hover:text-[#0F5132] dark:hover:text-white hover:border-[#20c997] px-6 py-3 rounded-full font-medium transition-all"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16l-4-4m0 0l4-4m-4 4h18"
                          />
                        </svg>
                        Back
                      </button>
                      <button
                        onClick={() => setActiveStep(3)}
                        className="inline-flex items-center gap-2 bg-[#20c997] hover:bg-[#1abc9c] text-[#0A3622] px-8 py-3 rounded-full font-semibold transition-all hover:shadow-lg"
                      >
                        Continue to Step 3
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 */}
                {activeStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-4xl">✅</span>
                      <div>
                        <h3 className="text-2xl font-bold text-[#0F5132] dark:text-white">Step 3: Review & Submit</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Agree to the process and submit your application
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Process Overview */}
                      <div className="bg-[#f0fdf4] dark:bg-[#0A3622]/50 rounded-xl p-6 border border-[#198754]/20">
                        <h4 className="text-[#0F5132] dark:text-white font-semibold mb-4">What Happens Next?</h4>
                        <div className="space-y-4">
                          {[
                            {
                              step: "1",
                              title: "Application Review",
                              desc: "Our team reviews your application within 3-5 business days",
                              time: "3-5 days",
                            },
                            {
                              step: "2",
                              title: "Initial Contact",
                              desc: "If approved, our Project Manager will contact you via email/phone",
                              time: "1-2 days",
                            },
                            {
                              step: "3",
                              title: "Timeline Discussion",
                              desc: "We'll share a detailed timeline and gather any additional requirements",
                              time: "1 week",
                            },
                            {
                              step: "4",
                              title: "Development Begins",
                              desc: "Once you approve the timeline, we start building your website",
                              time: "2-6 weeks",
                            },
                          ].map((item) => (
                            <div key={item.step} className="flex items-start gap-4">
                              <span className="w-8 h-8 bg-[#20c997]/20 rounded-full flex items-center justify-center text-[#198754] dark:text-[#20c997] font-bold text-sm flex-shrink-0">
                                {item.step}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[#0F5132] dark:text-white font-medium">{item.title}</h5>
                                  <span className="text-[#198754] dark:text-[#20c997] text-sm">{item.time}</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Agreement Checkbox */}
                      <label className="flex items-start gap-4 p-4 bg-[#f0fdf4] dark:bg-[#0A3622]/30 rounded-xl border border-[#198754]/20 cursor-pointer hover:border-[#20c997]/40 transition-all">
                        <input
                          type="checkbox"
                          checked={formData.timeline}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, timeline: e.target.checked }))
                          }
                          className="w-5 h-5 mt-1 accent-[#20c997]"
                        />
                        <div>
                          <span className="text-[#0F5132] dark:text-white font-medium">
                            I understand and agree to the process
                          </span>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            I acknowledge that once my application is approved, Project Managers
                            will contact me via the provided email or phone number to discuss
                            timelines. I agree to review and approve the proposed timeline before
                            development begins.
                          </p>
                        </div>
                      </label>

                      {/* Note about credits */}
                      <div className="flex items-start gap-3 p-4 bg-[#C9A962]/10 rounded-xl border border-[#C9A962]/30">
                        <span className="text-xl">ℹ️</span>
                        <div>
                          <span className="text-[#C9A962] font-medium">Please Note</span>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            All websites developed through this program will include a small credit
                            bar at the bottom footer acknowledging myOrg.in as the development
                            partner. This helps us continue providing free services to more
                            organizations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="inline-flex items-center gap-2 border border-[#198754]/50 text-gray-600 dark:text-gray-300 hover:text-[#0F5132] dark:hover:text-white hover:border-[#20c997] px-6 py-3 rounded-full font-medium transition-all"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16l-4-4m0 0l4-4m-4 4h18"
                          />
                        </svg>
                        Back
                      </button>
                      <button
                        disabled={!formData.timeline}
                        className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
                          formData.timeline
                            ? "bg-gradient-to-r from-[#20c997] to-[#198754] hover:from-[#1abc9c] hover:to-[#157347] text-white hover:shadow-xl hover:shadow-[#20c997]/30"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Submit Application
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Showcase Section */}
      <section id="projects" className="py-20 bg-[#f0fdf4] dark:bg-[#0A3622]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#198754] dark:text-[#20c997] font-semibold uppercase tracking-wider text-sm">
              Our Portfolio
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-white mt-4 mb-4">
              Projects We've Empowered
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              These organizations trusted us with their digital presence. Now they're making an even
              bigger impact.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {showcaseProjects.map((project, index) => (
              <motion.div
                key={project.subdomain}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white dark:bg-[#0F5132]/30 backdrop-blur-sm rounded-2xl border border-[#198754]/30 p-6 hover:border-[#20c997]/50 transition-all hover:shadow-xl shadow-lg dark:shadow-none dark:hover:shadow-[#20c997]/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium px-3 py-1 bg-[#20c997]/20 text-[#198754] dark:text-[#20c997] rounded-full">
                      {project.category}
                    </span>
                    <h3 className="text-xl font-bold text-[#0F5132] dark:text-white mt-3">{project.name}</h3>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      project.status === "Live"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-gray-500 dark:text-gray-400 mb-4">{project.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-[#198754]/20">
                  <code className="text-[#198754] dark:text-[#20c997] text-sm bg-[#f0fdf4] dark:bg-[#0A3622] px-3 py-1 rounded-lg">
                    {project.subdomain}.myorg.in
                  </code>
                  {project.status === "Live" && (
                    <a
                      href={`https://${project.subdomain}.myorg.in`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-[#20c997] transition-colors flex items-center gap-1 text-sm"
                    >
                      Visit Site
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your organization could be next. Join our growing community of impact makers.
            </p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 text-[#20c997] hover:text-[#1abc9c] font-semibold transition-colors"
            >
              Start Your Application
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#0F5132]/80 dark:backdrop-blur-sm rounded-3xl border border-[#198754]/30 dark:border-[#20c997]/30 p-8 md:p-12 shadow-xl dark:shadow-[#20c997]/5">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[#198754] dark:text-[#20c997] font-semibold uppercase tracking-wider text-sm">
                  Our Impact
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-white mt-4 mb-6">
                  Technology for{" "}
                  <span className="text-[#198754] dark:text-[#20c997]">Social Good</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Every website we build helps an organization reach more people, raise more funds,
                  and create more impact. We're not just building websites - we're building bridges
                  between those who want to help and those who need it.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "Rs 2Cr+", label: "Funds Raised", sub: "by our partner NGOs" },
                    { value: "25+", label: "Active Websites", sub: "across India" },
                    { value: "500+", label: "Volunteers Connected", sub: "through our platforms" },
                    { value: "10+", label: "States Covered", sub: "pan-India presence" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-[#f0fdf4] dark:bg-[#0A3622] rounded-xl border border-transparent dark:border-[#20c997]/20">
                      <div className="text-2xl md:text-3xl font-bold text-[#198754] dark:text-[#20c997]">
                        {stat.value}
                      </div>
                      <div className="text-[#0F5132] dark:text-white font-medium">{stat.label}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-[#198754]/30 to-[#20c997]/20 dark:from-[#0A3622] dark:to-[#198754]/40 rounded-3xl flex items-center justify-center border border-transparent dark:border-[#20c997]/20">
                  <div className="text-center">
                    <span className="text-8xl">🌱</span>
                    <p className="text-[#0F5132] dark:text-white text-xl font-medium mt-4">Growing Together</p>
                    <p className="text-[#198754] dark:text-[#20c997]">One Website at a Time</p>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-4 -right-4 w-20 h-20 border-2 border-[#20c997]/30 dark:border-[#20c997]/50 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 border-2 border-[#198754]/30 dark:border-[#198754]/50 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#f0fdf4] dark:bg-[#0A3622]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#198754] dark:text-[#20c997] font-semibold uppercase tracking-wider text-sm">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-white mt-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Is it really 100% free?",
                a: "Yes, absolutely! We don't charge anything for development, hosting on our subdomain, or ongoing support. The only thing we ask is a small credit in the footer.",
              },
              {
                q: "How long does it take to get a website?",
                a: "Typically 2-6 weeks from approval, depending on the complexity. Simple informational sites can be ready in 2 weeks, while feature-rich platforms may take longer.",
              },
              {
                q: "Can I use my own domain instead of myorg.in?",
                a: "The free tier includes a subdomain on myorg.in. If you have your own domain, we can discuss custom arrangements.",
              },
              {
                q: "What kind of websites can you build?",
                a: "We build responsive, modern websites including landing pages, donation platforms, event management sites, volunteer portals, and more. Complex web applications are evaluated case-by-case.",
              },
              {
                q: "What's the catch with the credit bar?",
                a: "It's a small, non-intrusive bar at the bottom of your website that says 'Developed by myOrg.in'. This helps us reach more organizations who might benefit from our services.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-[#0F5132]/30 rounded-xl border border-[#198754]/30 p-6 shadow-md dark:shadow-none"
              >
                <h3 className="text-[#0F5132] dark:text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-500 dark:text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#20c997] to-[#198754] rounded-3xl p-12"
          >
            <span className="text-5xl">🚀</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-4">
              Ready to Amplify Your Impact?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Don't let technical limitations hold back your mission. Apply today and let's build
              something amazing together.
            </p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 bg-white text-[#0F5132] hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-xl"
            >
              Start Your Free Application
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#198754]/20 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌱</span>
                <span className="text-xl font-bold text-[#0F5132] dark:text-white">
                  my<span className="text-[#20c997]">Org</span>.in
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Empowering change makers with free professional web development. Technology for
                social good.
              </p>
            </div>

            <div>
              <h4 className="text-[#0F5132] dark:text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["Mission", "Apply Now", "Projects", "Impact", "FAQ"].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(" ", "")}`}
                      className="text-gray-500 dark:text-gray-400 hover:text-[#20c997] transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#0F5132] dark:text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
                <li>ngo@gaurav.one</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#198754]/20 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} myOrg.in | An initiative by{" "}
              <a href="https://gaurav.one" className="text-[#198754] dark:text-[#20c997] hover:underline">
                Gaurav.one
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Credit Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0A3622] border-t border-[#198754]/30 py-2 z-40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-xs">
            Websites developed through myOrg.in include this credit bar •{" "}
            <a href="#apply" className="text-[#20c997] hover:underline">
              Apply for free development
            </a>
          </p>
        </div>
      </div>

      {/* Bottom padding for credit bar */}
      <div className="h-10" />
    </div>
  );
}
