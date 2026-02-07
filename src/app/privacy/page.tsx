"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import { Logo } from "@/components/ui";
import { domainUrls, globalConfig } from "@/config/global";
import { FaArrowLeft } from "react-icons/fa";

export default function PrivacyPolicyPage() {
  const { darkMode } = useDarkModeStore();

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-obsidian text-white" : "bg-white text-primaryDark"}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-obsidian/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={domainUrls.root}>
            <Logo className="h-8" />
          </Link>
          <Link
            href={domainUrls.root}
            className="flex items-center gap-2 text-sm text-primaryDark/60 dark:text-gray-400 hover:text-cyan transition-colors"
          >
            <FaArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-primaryDark/50 dark:text-gray-500 mb-10">
            Last updated: February 7, 2025
          </p>

          <div className="space-y-8 text-primaryDark/80 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">1. Introduction</h2>
              <p>
                Welcome to {globalConfig.displayName}. We respect your privacy and are committed to protecting
                your personal data. This privacy policy explains how we collect, use, and safeguard your
                information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">2. Information We Collect</h2>
              <p className="mb-3">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Contact Information:</strong> Name, email address, and phone number when you submit
                  our contact form or apply through our careers page.
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type, device type, operating system,
                  and general location data (city, region, country) for security and analytics purposes.
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, time spent on pages, and interaction patterns
                  collected through cookies and analytics tools.
                </li>
                <li>
                  <strong>Application Data:</strong> Resumes, passport numbers, country of origin, and work
                  experience submitted through our careers portal.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>To respond to your inquiries and contact form submissions</li>
                <li>To process job applications submitted through our careers page</li>
                <li>To improve our website, services, and user experience</li>
                <li>To protect against spam, fraud, and unauthorized access using reCAPTCHA</li>
                <li>To analyze website traffic and usage patterns through Google Analytics and Google Tag Manager</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">4. We Do Not Share Your Information</h2>
              <p>
                We do not sell, trade, rent, or otherwise share your personal information with any third
                parties. Your data stays with us and is used solely for the purposes described in this
                policy. We will never disclose your personal details to external organizations for
                marketing or any other commercial purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">5. Cookies and Tracking</h2>
              <p className="mb-3">Our website uses the following technologies:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Essential Cookies:</strong> To remember your cookie consent preference across
                  our subdomains.
                </li>
                <li>
                  <strong>Google Analytics (GA4):</strong> To understand how visitors interact with our
                  website. This collects anonymized usage data.
                </li>
                <li>
                  <strong>Google Tag Manager:</strong> To manage analytics and tracking scripts.
                </li>
                <li>
                  <strong>Google reCAPTCHA v3:</strong> To protect our forms from spam and abuse. This may
                  collect hardware and software information.
                </li>
              </ul>
              <p className="mt-3">
                You can accept or reject non-essential cookies through the cookie banner displayed on
                your first visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">6. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal
                data against unauthorized access, alteration, disclosure, or destruction. All form
                submissions are transmitted over encrypted HTTPS connections, and our database is
                secured with industry-standard practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">7. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes for
                which it was collected. Contact form submissions and job applications are retained for a
                reasonable period to process your request and for our legitimate business interests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">8. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Request access to the personal data we hold about you</li>
                <li>Request correction of any inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Withdraw your consent for cookies at any time by clearing your browser cookies</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href={`mailto:${globalConfig.email}`} className="text-cyan hover:underline">
                  {globalConfig.email}
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">9. Third-Party Services</h2>
              <p>
                Our website may contain links to third-party websites or services. We are not responsible
                for the privacy practices of these external sites. We encourage you to review their
                privacy policies before providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Any changes will be posted on this
                page with an updated revision date. Your continued use of our website after any changes
                constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primaryDark dark:text-white mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our data practices, please contact
                us at{" "}
                <a href={`mailto:${globalConfig.email}`} className="text-cyan hover:underline">
                  {globalConfig.email}
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
