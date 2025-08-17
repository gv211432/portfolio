import hook from "@/assets/img/conn.webp";
import Image from "next/image";

const HooksImages = ({ isFirst = false }) => {
  return <div className="relative w-full">
    {/* Book Hooks */}
    <div className={`absolute flex  ${isFirst ? "lg:hidden" : ""}
      px-16 justify-between w-full -mt-[6.5rem]`}>
      <Image src={hook} width={30} height={40} alt="hook" />
      <Image src={hook} width={30} height={40} alt="hook" />
    </div>
    <div className={`absolute flex ${isFirst ? "lg:hidden" : ""}
      px-12 justify-between w-full -mt-[6.5rem]`}>
      <Image src={hook} width={30} height={40} alt="hook" />
      <Image src={hook} width={30} height={40} alt="hook" />
    </div>
  </div>;
};

export default HooksImages;