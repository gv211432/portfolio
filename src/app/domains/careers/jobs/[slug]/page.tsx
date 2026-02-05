"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaClock,
  FaBriefcase,
  FaCode,
  FaFileContract,
  FaPaintBrush,
  FaServer,
  FaShieldAlt,
  FaReact,
  FaDatabase,
  FaCheckCircle,
  FaStar,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import {
  getJobBySlug,
  departmentInfo,
  jobTypeInfo,
  JobPosition,
} from "@/data/careersData";
import { useDarkModeStore } from "@/Atoms/globalAtoms";
import DarkModeToggleButton from "@/components/inputs/DarkModeToggleButton";
import { globalConfig, domainUrls } from "@/config/global";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaCode: FaCode,
  FaFileContract: FaFileContract,
  FaPaintBrush: FaPaintBrush,
  FaServer: FaServer,
  FaShieldAlt: FaShieldAlt,
  FaReact: FaReact,
  FaDatabase: FaDatabase,
};

// Application Form Component
const ApplicationForm = ({ job }: { job: JobPosition }) => {
  const [formData, setFormData] = useState({
    legalName: "",
    passportNo: "",
    countryOfOrigin: "",
    experience: "",
    email: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Resume file must be less than 5MB");
        return;
      }
      // Check file type
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Please upload a PDF or Word document");
        return;
      }
      setResume(file);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("jobSlug", job.slug);
      formDataToSend.append("jobTitle", job.title);
      formDataToSend.append("legalName", formData.legalName);
      formDataToSend.append("passportNo", formData.passportNo);
      formDataToSend.append("countryOfOrigin", formData.countryOfOrigin);
      formDataToSend.append("experience", formData.experience);
      formDataToSend.append("email", formData.email);
      if (resume) {
        formDataToSend.append("resume", resume);
      }

      const response = await fetch("/api/careers/apply", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      setSubmitStatus("success");
      setFormData({
        legalName: "",
        passportNo: "",
        countryOfOrigin: "",
        experience: "",
        email: "",
      });
      setResume(null);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center"
      >
        <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-400 mb-2">Application Submitted!</h3>
        <p className="text-gray-400">
          Thank you for applying. We'll review your application and get back to you soon.
        </p>
        <button
          onClick={() => setSubmitStatus("idle")}
          className="mt-6 px-6 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors"
        >
          Submit Another Application
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Legal Name */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Legal Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="legalName"
          value={formData.legalName}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white dark:bg-obsidian-50/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-colors"
          placeholder="Enter your full legal name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white dark:bg-obsidian-50/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-colors"
          placeholder="your@email.com"
        />
      </div>

      {/* Passport Number */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Passport Number <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="passportNo"
          value={formData.passportNo}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white dark:bg-obsidian-50/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-colors"
          placeholder="Enter your passport number"
        />
        <p className="text-xs text-gray-500 mt-1">Required for international wire transfers</p>
      </div>

      {/* Country of Origin */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Country of Origin <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="countryOfOrigin"
          value={formData.countryOfOrigin}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white dark:bg-obsidian-50/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-colors"
          placeholder="Enter your country"
        />
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Years of Experience <span className="text-red-400">*</span>
        </label>
        <select
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white dark:bg-obsidian-50/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition-colors"
        >
          <option value="">Select experience level</option>
          <option value="0-1">0-1 years</option>
          <option value="1-3">1-3 years</option>
          <option value="3-5">3-5 years</option>
          <option value="5-7">5-7 years</option>
          <option value="7-10">7-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Resume <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="flex items-center justify-center w-full px-4 py-6 bg-white dark:bg-obsidian-50/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-cyan/50 transition-colors"
          >
            {resume ? (
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-400" />
                <span className="text-gray-900 dark:text-white">{resume.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setResume(null);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <FaUpload className="text-gray-400 dark:text-gray-500 text-2xl mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Click to upload resume</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF or Word (max 5MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-gradient-to-r from-cyan to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <FaSpinner className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <FaPaperPlane />
            Submit Application
          </>
        )}
      </button>

      {/* Payment Note */}
      <p className="text-xs text-gray-500 text-center">
        By submitting, you agree that payments will be made via international wire transfer or cryptocurrency (USDC/USDT).
      </p>
    </form>
  );
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { darkMode } = useDarkModeStore();
  const slug = params.slug as string;
  const job = getJobBySlug(slug);

  if (!job) {
    return (
      <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
        <div className="bg-light dark:bg-obsidian text-primaryDark dark:text-white transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">The job position you're looking for doesn't exist.</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan/20 border border-cyan/30 rounded-lg text-cyan hover:bg-cyan/30 transition-colors"
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[job.icon] || FaCode;
  const deptInfo = departmentInfo[job.department];
  const typeInfo = jobTypeInfo[job.type];

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-light dark:bg-obsidian text-primaryDark dark:text-white transition-colors duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-light/80 dark:bg-obsidian/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href={domainUrls.root} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-primary flex items-center justify-center">
                  <span className="text-obsidian font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-primaryDark dark:text-white">
                  {globalConfig.displayName}
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href={domainUrls.root} className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm">
                  Home
                </Link>
                <Link href={domainUrls.careers} className="text-cyan font-medium text-sm">
                  Careers
                </Link>
                <Link href={domainUrls.opensource} className="text-primaryDark/70 dark:text-gray-400 hover:text-cyan transition-colors text-sm">
                  Open Source
                </Link>
              </nav>

              <div className="flex items-center gap-4">
                <DarkModeToggleButton />
              </div>
            </div>
          </div>
        </header>

        {/* Blockchain Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan/5 via-transparent to-transparent" />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 mb-8 text-gray-500 dark:text-gray-400 hover:text-cyan transition-colors"
        >
          <FaArrowLeft />
          Go Back
        </motion.button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Job Details - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${job.gradient} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="text-2xl text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold mb-4">{job.title}</h1>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${deptInfo.bgColor} ${deptInfo.color}`}>
                      {deptInfo.label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm border border-gray-300 dark:border-gray-700 ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-cyan" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-cyan" />
                      Full-time
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBriefcase className="text-cyan" />
                      {job.department}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-4">About the Role</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
            </motion.div>

            {/* Responsibilities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-4">Responsibilities</h2>
              <ul className="space-y-3">
                {job.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FaCheckCircle className="text-cyan mt-1 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {job.requirements.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FaCheckCircle className="text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Nice to Have */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-4">Nice to Have</h2>
              <ul className="space-y-3">
                {job.niceToHave.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FaStar className="text-gold mt-1 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-bold mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {job.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-obsidian border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Application Form - Right Column */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-white/80 dark:bg-obsidian-50/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-6">Apply Now</h2>
              <ApplicationForm job={job} />
            </motion.div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
