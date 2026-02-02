"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { domainUrls, globalConfig } from "@/config/global";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Case Study", href: domainUrls.casestudy, external: true },
  { name: "Whitelabel", href: domainUrls.whitelabel, external: true },
  { name: "Blogs", href: domainUrls.blogs, external: true },
  { name: "NGO", href: domainUrls.ngo, external: false },
  { name: "Contact", href: "#contact" },
];

const services = [
  {
    icon: "🌐",
    title: "Web Development",
    description: "Full-stack web applications with React, Next.js, Node.js, and modern technologies.",
  },
  {
    icon: "⛓️",
    title: "Blockchain Solutions",
    description: "Smart contracts, DApps, and Web3 integrations on Ethereum, Solana, and more.",
  },
  {
    icon: "📱",
    title: "Mobile Apps",
    description: "Cross-platform mobile applications with React Native and native technologies.",
  },
  {
    icon: "🎨",
    title: "UI/UX Design",
    description: "User-centered design that combines aesthetics with functionality.",
  },
  {
    icon: "☁️",
    title: "Cloud & DevOps",
    description: "AWS, Docker, Kubernetes deployments with CI/CD automation.",
  },
  {
    icon: "🤖",
    title: "AI Integration",
    description: "Machine learning models and AI-powered features for your applications.",
  },
];

const stats = [
  { number: "50+", label: "Projects Delivered" },
  { number: "5+", label: "Years Experience" },
  { number: "30+", label: "Happy Clients" },
  { number: "99%", label: "Client Satisfaction" },
];

const testimonials = [
  {
    name: "Alex Thompson",
    role: "CEO, TechStart",
    content: "Exceptional work on our blockchain platform. Delivered on time with outstanding quality.",
    avatar: "AT",
  },
  {
    name: "Sarah Chen",
    role: "Founder, DataFlow",
    content: "The team's expertise in full-stack development transformed our business operations.",
    avatar: "SC",
  },
  {
    name: "Michael Ross",
    role: "CTO, InnovateCo",
    content: "Professional, responsive, and technically brilliant. Highly recommended!",
    avatar: "MR",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primaryDark">
                Gaurav<span className="text-primary">.one</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-primaryGray hover:text-primary transition-colors font-medium"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <a
                href="#contact"
                className="bg-primary hover:bg-primaryDark text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
              >
                Get in Touch
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6 text-primaryDark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden py-4 border-t"
            >
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="block py-3 text-primaryGray hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#contact"
                className="block mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get in Touch
              </a>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-20 bg-gradient-to-br from-primaryDark via-primaryGray to-primaryDark overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-6">
                Welcome to Gaurav.one
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Building Digital
                <span className="text-primary"> Experiences</span> That Matter
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-xl">
                We craft exceptional digital products with cutting-edge technologies.
                From blockchain solutions to full-stack applications, we turn your vision into reality.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#services"
                  className="bg-primary hover:bg-white hover:text-primaryDark text-white px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-xl"
                >
                  Explore Services
                </a>
                <a
                  href={domainUrls.me}
                  className="border-2 border-white text-white hover:bg-white hover:text-primaryDark px-8 py-4 rounded-lg font-semibold transition-all"
                >
                  View Portfolio
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10">
                <div className="w-full h-[400px] bg-gradient-to-br from-primary/30 to-primaryDark/50 rounded-3xl backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🚀</div>
                    <p className="text-white text-xl font-medium">Innovation Driven</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-primaryGray font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="w-full h-[400px] bg-gradient-to-br from-primaryDark to-primaryGray rounded-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-7xl mb-4">👨‍💻</div>
                    <p className="text-2xl font-bold">5+ Years</p>
                    <p className="text-primary">of Excellence</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-primary text-white p-6 rounded-xl shadow-lg">
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm">Projects</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold uppercase tracking-wider">About Us</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark mt-4 mb-6">
                We Create Digital Solutions That Drive Results
              </h2>
              <p className="text-primaryGray mb-6 leading-relaxed">
                Based in Mumbai, India, we specialize in building cutting-edge digital products
                that help businesses thrive in the modern world. Our expertise spans from
                blockchain development to full-stack web applications.
              </p>
              <ul className="space-y-4 mb-8">
                {["Expert Full-Stack Development", "Blockchain & Web3 Solutions", "Scalable Cloud Architecture", "AI-Powered Applications"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-primaryGray">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={domainUrls.me}
                className="inline-flex items-center gap-2 bg-primaryDark hover:bg-primary text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Learn More
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider">Our Services</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark mt-4">
              What We Offer
            </h2>
            <p className="text-primaryGray mt-4 max-w-2xl mx-auto">
              Comprehensive digital solutions tailored to your business needs
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
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-5xl mb-6">{service.icon}</div>
                <h3 className="text-xl font-bold text-primaryDark mb-4 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-primaryGray leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-primaryDark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-primary text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold uppercase tracking-wider">Contact Us</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-primaryDark mt-4 mb-6">
                Let's Build Something Amazing Together
              </h2>
              <p className="text-primaryGray mb-8 leading-relaxed">
                Have a project in mind? We'd love to hear about it. Get in touch and let's
                discuss how we can help bring your ideas to life.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-primaryGray">Email</div>
                    <a href={`mailto:${globalConfig.email}`} className="text-primaryDark font-medium hover:text-primary">
                      {globalConfig.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-primaryGray">Location</div>
                    <div className="text-primaryDark font-medium">Mumbai, India</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-primaryGray">Working Hours</div>
                    <div className="text-primaryDark font-medium">Mon - Sat: 9AM - 7PM IST</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <a href="https://github.com/AstroX11" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primaryDark hover:bg-primary rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/in/AstroX11" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primaryDark hover:bg-primary rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://twitter.com/formal_gaurav" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primaryDark hover:bg-primary rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <form className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-primaryGray mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primaryGray mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primaryGray mb-2">Subject</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Project Inquiry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primaryGray mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primaryDark text-white py-4 rounded-lg font-semibold transition-all hover:shadow-lg"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primaryDark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-6">
                <span className="text-2xl font-bold text-white">
                  Gaurav<span className="text-primary">.one</span>
                </span>
              </Link>
              <p className="text-gray-400 mb-6 max-w-md">
                Building exceptional digital experiences. From blockchain solutions
                to full-stack applications, we help businesses thrive in the digital world.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/AstroX11" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  GitHub
                </a>
                <a href="https://linkedin.com/in/AstroX11" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  LinkedIn
                </a>
                <a href="https://twitter.com/formal_gaurav" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">
                  Twitter
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                {services.slice(0, 4).map((service) => (
                  <li key={service.title}>
                    <span className="text-gray-400">{service.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Gaurav.one. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
