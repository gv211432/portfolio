import HooksImages from "@/components/helpers/HooksImages";

interface SectionWrapperProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isFirst?: boolean;
  [key: string]: any;
}

const SectionWrapper = (
  { title, icon, children, isFirst = false, ...rest }: SectionWrapperProps
) => (
  <section
    className={`dark:bg-slate-950 border-[1px] border-gray-400 shadow-lg 
      my-4 rounded-[16px] px-4 py-16 ${isFirst ? 'lg:pt-8' : ''} lg:px-12`}
    {...rest}>

    <HooksImages isFirst={isFirst} />

    <div className="flex items-center gap-3 mb-6">
      <div className="text-2xl text-[#444A6E]">{icon}</div>
      <h2 className="text-xl font-bold dark:text-white text-gray-800">{title}</h2>
    </div>
    <div className="grid xl:grid-cols-3 sm:grid-cols-2 gap-6">{children}</div>
  </section>
);


export default SectionWrapper;