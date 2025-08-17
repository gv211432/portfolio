import { motion } from "framer-motion";

const SectionWebsiteCard = ({ title }: { title: string; }) => (
  <motion.div
    className="rounded-xl border-[1px] border-gray-300 dark:border-slate-700
     dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all p-5"
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex items-start justify-between ">
      <button
        type="button"
        title="Open in new tab"
        onClick={() => window.open(title, "_blank", "noopener,noreferrer")}
        className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400"
      >
        <div className="flex items-center gap-3">
          {/* <div className="text-xl text-[#444A6E]">{<FaLaptopCode />}</div> */}
          <div className="h-[3rem] w-[4rem] bg-white rounded-lg"></div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">
              {title}
            </h3>
          </div>
        </div>
      </button>
    </div>

  </motion.div>
);

export default SectionWebsiteCard;