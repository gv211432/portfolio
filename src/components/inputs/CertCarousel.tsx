import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { FaCertificate } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import { HooksImages } from "../sections/Graphics";

export type Cert = {
  title: string;
  subtitle: string;
  description?: string;
  link: string;
  staticImage?: string; // Optional static image URL
};

type EnrichedCert = Cert & { image?: string; };

type CertCarouselProps = {
  certs: Cert[];
};

const Card = ({ title, subtitle, description, link, image, staticImage }: EnrichedCert) => (
  <motion.a
    // @ts-ignore
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all p-5 block"
    whileHover={{ scale: 1.03 }}
  >
    {image && (
      <img
        src={image || staticImage}
        alt={title}
        className="w-full h-40 object-contain rounded-md mb-4"
        loading="lazy"
      />
    )}
    <div className="flex items-center gap-3 mb-3">
      <div className="text-xl text-[#444A6E]">
        <FaCertificate />
      </div>
      <div>
        <h3 className="text-lg font-semibold dark:text-white text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-300">
      {description || "Click to view certificate"}
    </p>
  </motion.a>
);

export const CertCarousel: React.FC<CertCarouselProps> = ({ certs }) => {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      skipSnaps: false,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [enrichedCerts, setEnrichedCerts] = useState<EnrichedCert[]>([]);
  useEffect(() => {
    const fetchPreviews = async () => {
      const previews = await Promise.all(
        certs.map(async (cert) => {
          try {
            if (cert.staticImage) {
              return { ...cert, image: cert.staticImage };
            } else {
              const res = await axios.get("https://api.microlink.io", {
                params: { url: cert.link },
              });
              return {
                ...cert,
                image: res.data?.data?.image?.url || undefined,
              };
            }
          } catch (err) {
            console.warn("Preview load failed for:", cert.link);
            return cert;
          }
        })
      );
      setEnrichedCerts(previews);
    };

    fetchPreviews();
  }, [certs]);

  return (
    <section className="relative dark:bg-slate-950 border-[1px] border-gray-400 shadow-lg my-4 rounded-[16px] px-4 py-16 lg:px-12">
      <HooksImages />

      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl text-[#444A6E]">
          <FaCertificate />
        </div>
        <h2 className="text-xl font-bold dark:text-white text-gray-800">
          Certifications
        </h2>
      </div>


      <div className="overflow-hidden py-2  pb-8 w-[calc(100% + 8px)]" ref={emblaRef}>
        <div className="flex gap-6">
          {enrichedCerts.map((cert, idx) => (
            <div
              style={{
                minWidth: enrichedCerts.length - 1 == idx ? "324px" : "300px",
                paddingRight: enrichedCerts.length - 1 == idx ? "24px" : "0"
              }}
              key={idx}
              className="min-w-1/3"
            >
              <Card {...cert} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
