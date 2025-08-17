import { CertCarousel } from "../inputs/CertCarousel";
import SectionWrapper from "@/components/helpers/SectionWrapper";
import SectionCard from "@/components/helpers/SectionCard";
import { FaBriefcase, FaCode, FaGraduationCap, FaLaptopCode } from "react-icons/fa";
import ExpandableSection from "@/components/helpers/ExpandableSection";
import SectionWebsiteCard from "@/components/helpers/SectionWebsitCard";
import {
  MdPerson,
  MdArticle,
  MdBusinessCenter,
} from "react-icons/md";
import {
  myBio, myCerts, myEducation, myExperiences, myFreelancing,
  myPapers, myProjects, websiteWorks
} from "@/config/myData";


export default function PortfolioSections() {
  return (
    <div className="pb-24 px-4 md:px-0 mt-[3rem] lg:mt-0">
      <SectionWrapper isFirst={true} id="about" title="Bio" icon={<MdPerson />}>
        {myBio.map((item, i) => (
          <SectionCard
            key={i}
            title={item.title}
            subtitle={item.subtitle}
            description={item.description}
            icon={item.icon}
            link={item.link}
          />
        ))}
      </SectionWrapper>

      <SectionWrapper title="Works" icon={<FaLaptopCode />}>
        <ExpandableSection
          items={websiteWorks}
          renderItem={(websites, i) => (
            <SectionWebsiteCard
              key={i}
              title={websites}
            />
          )}
        />
      </SectionWrapper>

      <SectionWrapper title="Experiences" icon={<FaBriefcase />}>
        {myExperiences.map((exp, i) => (
          <SectionCard
            key={i}
            title={exp.title}
            subtitle={exp.subtitle}
            description={exp.description}
            icon={exp.icon}
            link={exp.link}
          />
        ))}
      </SectionWrapper>

      <SectionWrapper id="projects" title="Projects" icon={<FaCode />}>
        {myProjects.map((p, i) => (
          <SectionCard
            key={i}
            title={p.title}
            subtitle={p.subtitle}
            description={p.description}
            icon={p.icon}
            link={p.link}
          />
        ))}
      </SectionWrapper>

      <SectionWrapper id="papers" title="Papers" icon={<MdArticle />}>
        <ExpandableSection
          items={myPapers}
          renderItem={(paper, i) => (
            <SectionCard
              key={i}
              title={paper.title}
              subtitle={paper.subtitle}
              description={paper.description}
              icon={paper.icon}
              link={paper.link}
            />
          )}
        />
      </SectionWrapper>

      <SectionWrapper title="Freelancing" icon={<MdBusinessCenter />}>
        {myFreelancing.map((item, i) => (
          <SectionCard
            key={i}
            title={item.title}
            subtitle={item.subtitle}
            description={item.description}
            icon={item.icon}
            link={item.link}
          />
        ))}
      </SectionWrapper>

      <SectionWrapper title="Education" icon={<FaGraduationCap />}>
        {myEducation.map((edu, i) => (
          <SectionCard
            key={i}
            title={edu.title}
            subtitle={edu.subtitle}
            description={edu.description}
            icon={edu.icon}
            link={edu.link}
          />
        ))}
      </SectionWrapper>

      <CertCarousel certs={myCerts} />
    </div>
  );
}
