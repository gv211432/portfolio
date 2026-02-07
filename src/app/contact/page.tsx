"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { domainUrls, globalConfig } from "@/config/global";
import { Logo, FloroActionButton } from "@/components/ui";
import { FaArrowLeft, FaCheck, FaSpinner } from "react-icons/fa";
import { HiMail, HiPhone, HiUser, HiCurrencyDollar } from "react-icons/hi";
import { BsChatDots } from "react-icons/bs";
import { getRecaptchaToken } from "@/utils/recaptcha";
import RecaptchaBadge from "@/components/ui/RecaptchaBadge";

const budgetOptions = [
  { value: "", label: "Select your budget range" },
  { value: "< $5,000", label: "Less than $5,000" },
  { value: "$5,000 - $10,000", label: "$5,000 - $10,000" },
  { value: "$10,000 - $25,000", label: "$10,000 - $25,000" },
  { value: "$25,000 - $50,000", label: "$25,000 - $50,000" },
  { value: "$50,000 - $100,000", label: "$50,000 - $100,000" },
  { value: "> $100,000", label: "More than $100,000" },
  { value: "Not sure", label: "Not sure yet" },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  budget: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  budget?: string;
  message?: string;
}

export default function ContactPage() {
  const { darkMode, initializeDarkMode } = useDarkModeStore();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    budget: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.budget) {
      newErrors.budget = "Please select a budget range";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please tell us about your project";
    } else if (formData.message.trim().length < 20) {
      newErrors.message = "Please provide more details (at least 20 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const recaptchaToken = await getRecaptchaToken("contact_submit");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", phone: "", budget: "", message: "" });
      } else {
        setSubmitError(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError("Failed to submit. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-light dark:bg-obsidian transition-colors duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 dark:bg-obsidian/95 backdrop-blur-sm border-b border-primary/10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link
                  href={domainUrls.root}
                  className="flex items-center gap-2 text-primaryDark/60 dark:text-gray-400 hover:text-primary transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
                <div className="h-6 w-px bg-primary/20" />
                <Logo size="lg" href={domainUrls.root} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl lg:text-5xl font-bold text-primaryDark dark:text-white mb-4">
                Let's Build Something{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-primary font-cinzel font-black">
                  Amazing
                </span>
              </h1>
              <p className="text-lg text-primaryDark/70 dark:text-gray-400 max-w-2xl mx-auto">
                Tell us about your project and we'll get back to you within 24 hours
                with a detailed proposal.
              </p>
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white dark:bg-obsidian-50 rounded-2xl shadow-xl border border-primary/10 overflow-hidden"
            >
              {isSubmitted ? (
                /* Success State */
                <div className="p-8 lg:p-12 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheck className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-primaryDark dark:text-white mb-4">
                    Message Sent Successfully!
                  </h2>
                  <p className="text-primaryDark/70 dark:text-gray-400 mb-8">
                    Thank you for reaching out. We'll review your project details and
                    get back to you within 24 hours.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <FloroActionButton href={domainUrls.root} asLink>
                      Back to Home
                    </FloroActionButton>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-3 border border-primary/30 text-primaryDark dark:text-white rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="p-8 lg:p-12">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-primaryDark dark:text-gray-300 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-obsidian border rounded-xl text-primaryDark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                            errors.name
                              ? "border-red-500 focus:ring-red-500/50"
                              : "border-gray-200 dark:border-gray-700 focus:ring-cyan/50 focus:border-cyan"
                          }`}
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-primaryDark dark:text-gray-300 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-obsidian border rounded-xl text-primaryDark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                            errors.email
                              ? "border-red-500 focus:ring-red-500/50"
                              : "border-gray-200 dark:border-gray-700 focus:ring-cyan/50 focus:border-cyan"
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-primaryDark dark:text-gray-300 mb-2">
                        Phone Number{" "}
                        <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <HiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-obsidian border border-gray-200 dark:border-gray-700 rounded-xl text-primaryDark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan/50 focus:border-cyan transition-all"
                        />
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-primaryDark dark:text-gray-300 mb-2">
                        Budget Range <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <HiCurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-obsidian border rounded-xl text-primaryDark dark:text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                            errors.budget
                              ? "border-red-500 focus:ring-red-500/50"
                              : "border-gray-200 dark:border-gray-700 focus:ring-cyan/50 focus:border-cyan"
                          }`}
                        >
                          {budgetOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                        </svg>
                      </div>
                      {errors.budget && (
                        <p className="mt-1 text-sm text-red-500">{errors.budget}</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-primaryDark dark:text-gray-300">
                        Tell us about your project <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-xs ${
                          formData.message.length > 9500
                            ? "text-orange-500"
                            : formData.message.length > 10000
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {formData.message.length.toLocaleString()} / 10,000
                      </span>
                    </div>
                    <div className="relative">
                      <BsChatDots className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={8}
                        maxLength={10000}
                        placeholder="Describe your project, goals, timeline, and any specific requirements. The more detail you provide, the better we can understand your needs and provide an accurate estimate..."
                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-obsidian border rounded-xl text-primaryDark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-y min-h-[150px] ${
                          errors.message
                            ? "border-red-500 focus:ring-red-500/50"
                            : "border-gray-200 dark:border-gray-700 focus:ring-cyan/50 focus:border-cyan"
                        }`}
                      />
                    </div>
                    {errors.message ? (
                      <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-400">
                        Minimum 20 characters. Include project goals, features, timeline, and any technical requirements.
                      </p>
                    )}
                  </div>

                  {/* Submit Error */}
                  {submitError && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-sm text-red-500">{submitError}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-cyan to-cyan-600 hover:from-cyan-600 hover:to-cyan text-obsidian px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-xl hover:shadow-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Get Your Free Estimate"
                      )}
                    </button>
                  </div>

                  {/* Privacy Note */}
                  <p className="mt-4 text-xs text-center text-primaryDark/50 dark:text-gray-500">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy" className="text-cyan hover:underline">
                      Privacy Policy
                    </Link>
                    . We'll never share your information with third parties.
                  </p>
                  <RecaptchaBadge />
                </form>
              )}
            </motion.div>

            {/* Alternative Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 text-center"
            >
              <p className="text-primaryDark/60 dark:text-gray-400 mb-4">
                Prefer to reach out directly?
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`mailto:${globalConfig.email}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primaryDark dark:text-white transition-colors"
                >
                  <HiMail className="w-5 h-5 text-primary" />
                  {globalConfig.email}
                </a>
                <a
                  href="https://t.me/gaaaalileo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 rounded-lg text-primaryDark dark:text-white transition-colors"
                >
                  <svg className="w-5 h-5 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.093.034.305.019.471z" />
                  </svg>
                  @gaaaalileo
                </a>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-primary/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-primaryDark/50 dark:text-gray-500 text-sm">
                © {new Date().getFullYear()} {globalConfig.displayName}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
