// Components to add below the typewriter effect
// - Biographics
// - ProjectoGraphics
// - ExperiencoGraphics
// - EduGraphics

import { motion } from "framer-motion";
import { FaCode, FaBriefcase, FaGraduationCap } from "react-icons/fa";
import { MdPerson } from "react-icons/md";

const SectionWrapper = ({ title, icon, children }: any) => (
  <section className="px-4 py-8 lg:px-12 ">
    <div className="flex items-center gap-3 mb-6">
      <div className="text-2xl text-[#444A6E]">{icon}</div>
      <h2 className="text-xl font-bold dark:text-white text-gray-800">
        {title}
      </h2>
    </div>
    <div className="grid xl:grid-cols-3 sm:grid-cols-2 gap-6">{children}</div>
  </section>
);

const Card = ({ title, subtitle, description, icon }: any) => (
  <motion.div
    className="rounded-xl border-[1px] border-gray-300 dark:border-slate-700  dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all p-5"
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="text-xl text-[#444A6E]">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold dark:text-white text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-300">
      {description || "Description goes here..."}
    </p>
  </motion.div>
);

export default function PortfolioSections() {
  return (
    <div className=" pb-24 dark:bg-slate-950 ">
      <SectionWrapper title="BioGraphics" icon={<MdPerson />}>
        <Card
          title="Intro"
          subtitle="Who am I?"
          description="A passionate developer from Mumbai with experience in full-stack and Web3 technologies."
          icon={<MdPerson />}
        />
      </SectionWrapper>

      <SectionWrapper title="ProjectoGraphics" icon={<FaCode />}>
        <Card
          title="Phrase.Trade"
          subtitle="Web3 NFT Dapp"
          description="Built a text-based NFT marketplace on Arbitrum using React, Express, and Solidity."
          icon={<FaCode />}
        />
        <Card
          title="Portfolio Website"
          subtitle="Personal showcase"
          description="Responsive React site with typewriter and scroll effects."
          icon={<FaCode />}
        />
      </SectionWrapper>

      <SectionWrapper title="ExperiencoGraphics" icon={<FaBriefcase />}>
        <Card
          title="Freelance Developer"
          subtitle="2020 - Present"
          description="Worked with international clients to deliver scalable full-stack and Web3 solutions."
          icon={<FaBriefcase />}
        />
        <Card
          title="Startup CTO"
          subtitle="2021 - 2023"
          description="Led engineering team, built and shipped MVPs across fintech and e-learning sectors."
          icon={<FaBriefcase />}
        />
      </SectionWrapper>

      <SectionWrapper title="EduGraphics" icon={<FaGraduationCap />}>
        <Card
          title="MSc IT"
          subtitle="University of Mumbai"
          description="Graduated with strong foundations in computer science and modern web technologies."
          icon={<FaGraduationCap />}
        />
        <Card
          title="Certifications"
          subtitle="Blockchain & Web Dev"
          description="Completed courses in Solidity, React, and Cloud DevOps."
          icon={<FaGraduationCap />}
        />
      </SectionWrapper>
    </div>
  );
}
