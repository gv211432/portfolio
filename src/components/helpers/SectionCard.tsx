import { motion } from "framer-motion";
import { CardProps } from "@/types/section";

const SectionCard = ({ title, subtitle, description, icon, link }: CardProps) => (
  <motion.div
    className="rounded-xl border-[1px] border-gray-300 dark:border-slate-700
     dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all p-5"
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="text-xl text-[#444A6E]">{icon}</div>
      <div>
        {link ?
          <a href={link} className=""
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">
              {title}
            </h3>
          </a>
          : <h3 className="text-lg font-semibold dark:text-white text-gray-900">
            {title}
          </h3>}
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-300">
      {description || "Description goes here..."}
    </p>
  </motion.div>
);

export default SectionCard;