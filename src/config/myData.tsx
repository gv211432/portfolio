import { Cert } from "@/components/inputs/CertCarousel";
import { CardProps } from "@/types/section";
import {
  FaCode,
  FaBriefcase,
  FaGraduationCap,
  FaLaptopCode
} from "react-icons/fa";
import { MdArticle, MdBusinessCenter, MdPerson } from "react-icons/md";

export const myBio: CardProps[] = [
  {
    title: "Introduction",
    subtitle: "Who am I?",
    description: "A relentless full-stack and Web3 developer from Mumbai, part hustler, part degen, driven by innovation, late-night builds, and the pursuit of scalable, cutting-edge solutions.",
    icon: <MdPerson />,
  }
];

export const myPapers: CardProps[] = [
  {
    title: "Distributed Micro Computing",
    subtitle: "Clustered Microservices",
    description: "Explored decentralized computing models and task distribution using cluster-based microservices.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/uploadedfiles/paper//issue_6_june_2024/59059/final/fin_irjmets1718302740.pdf"
  },
  {
    title: "Transformative Potential of AR",
    subtitle: "AR/VR/CV in Industrial Training",
    description: "Evaluated how AR, VR and Computer Vision cut training time, boost retention and deliver measurable ROI.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/upload_newfiles/irjmets70600042549/paper_file/irjmets70600042549.pdf"
  },
  {
    title: "Detecting Text Sentiments in DBs",
    subtitle: "Semantic Duplicate Detection",
    description: "Designed a FastAPI + PostgreSQL pipeline that uses sentence embeddings to eliminate near-duplicate text in real time.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/uploadedfiles/paper//issue_11_november_2024/63431/final/fin_irjmets1732730207.pdf"
  },
  {
    title: "Skin Cancer Detection using AI",
    subtitle: "Melanoma Classification via CNNs",
    description: "Reviewed deep-learning techniques (CNNs & transfer learning) to boost early melanoma diagnosis accuracy.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/uploadedfiles/paper//issue_6_june_2024/59339/final/fin_irjmets1718969606.pdf"
  },
  {
    title: "Tackling Racism and Negativity using AI",
    subtitle: "Generative AI Content Moderation",
    description: "Built a FastAPI + Gemini-1.5 service that flags racist or toxic comments with 92 % accuracy.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/uploadedfiles/paper//issue_11_november_2024/63333/final/fin_irjmets1732825335.pdf"
  },
  {
    title: "AI in Performance Management",
    subtitle: "Real-Time HR Analytics",
    description: "Showed how AI-driven feedback loops, predictive analytics and VR/AR tools modernize workforce reviews.",
    icon: <MdArticle />,
    link: "https://www.irjmets.com/upload_newfiles/irjmets70600044325/paper_file/irjmets70600044325.pdf"
  },
];

export const myExperiences: CardProps[] = [
  {
    title: "Full Stack Engineer",
    subtitle: "Motilal Oswal Financial Services",
    description: "Contributed to internal tools and dashboards used for financial reporting and investment tracking.",
    icon: <FaBriefcase />,
  },
  {
    title: "Full Stack Web3 Developer",
    subtitle: "Nurture Labs",
    description: "Led dApp architecture and smart contract development using Solidity, Hardhat, and Next.js.",
    icon: <FaBriefcase />,
  },
  {
    title: "Full Stack Developer",
    subtitle: "Oyesters Trainings",
    description: "Built scalable learning platforms and student dashboards using MERN stack.",
    icon: <FaBriefcase />,
  },
  {
    title: "Tech Associate",
    subtitle: "Inox Leisure Ltd.",
    description: "Worked on cinema-tech integrations, including payment APIs and mobile app enhancements.",
    icon: <FaBriefcase />,
  }
];

export const myFreelancing: CardProps[] = [
  {
    title: "Founder",
    subtitle: "Phrase.Trade | Personal Project",
    description: "Bootstrapped a complete Web3 marketplace with zero external funding; handled end-to-end product dev.",
    icon: <MdBusinessCenter />,
  },
  {
    title: "Core Dev",
    subtitle: "Algora Call Bot | Algora Labs",
    description: "Engineered backend infra and trading logic for a profitable meme trading AI bot.",
    icon: <MdBusinessCenter />,
  },
  {
    title: "Tech Lead",
    subtitle: "Rewardroot | Opinosoft",
    description: "Oversaw product design, architecture, and scalability decisions for reward-based engagement platform.",
    icon: <MdBusinessCenter />,
  }
];

export const myEducation: CardProps[] = [
  {
    title: "MS in Information Technology",
    subtitle: "University of Mumbai",
    description: "Graduated with deep focus in distributed systems, Web development, and artificial intelligence.",
    icon: <FaGraduationCap />,
  }
];

export const myCerts: Cert[] = [
  {
    title: "Redhat Certified System Administrator",
    subtitle: "Redhat - 2024",
    description: "Proficient in Linux system administration and automation.",
    link: "https://www.credly.com/badges/cd0cd389-b0bc-488e-9ca3-edc033f7c392",
  },
  {
    title: "Full Stack Development",
    subtitle: "Internshala Trainings",
    description: "Trained in frontend and backend development, REST APIs, and deployment workflows.",
    link: "https://trainings.internshala.com/view_certificate/1C703CEA-DE2B-33BC-2D07-193BD3C8ADFD/dspe2xfujhm",
    staticImage: "/img/full-stack.png",
  },
  {
    title: "Blockchain Platforms",
    subtitle: "University at Buffalo",
    description: "Mastered smart contract development, cryptographic primitives, and consensus algorithms.",
    link: "https://www.coursera.org/account/accomplishments/certificate/NMRKT6WT9CR5",
    staticImage: "/img/blockchain-platforms.png",
  },
  {
    title: "Decentralized Applications",
    subtitle: "University at Buffalo",
    description: "Developed decentralized applications using Ethereum and Solidity.",
    link: "https://www.coursera.org/account/accomplishments/certificate/XUDQU78YRQ5H",
    staticImage: "/img/decentralize-apps.png",
  },
  {
    title: "Crypto Currencies",
    subtitle: "University of Michigan",
    description: "Explored the fundamentals of cryptocurrencies, blockchain technology, and their applications.",
    link: "https://www.coursera.org/account/accomplishments/certificate/YU8PMJPAZ333",
    staticImage: "/img/cryptocurrency.png",
  },
  {
    title: "Blockchain Business Models",
    subtitle: "Duke University",
    description: "Analyzed blockchain business models and their impact on various industries.",
    link: "https://www.coursera.org/account/accomplishments/certificate/2ZAH5J9AYHY3",
    staticImage: "/img/business-models.png",
  },
  {
    title: "Blockchain Scalability",
    subtitle: "The University of Sydney",
    description: "Learned about blockchain scalability challenges and solutions.",
    link: "https://www.coursera.org/account/accomplishments/certificate/E57UTCVYCRQP",
    staticImage: "/img/blockchain-scalability.png",
  },
  {
    title: "Programming with D3.js",
    subtitle: "New York University",
    description: "Mastered data visualization techniques using D3.js.",
    link: "https://www.coursera.org/account/accomplishments/certificate/CRRGZAJSCYAQ",
    staticImage: "/img/programming-with-d3.png",
  },
  {
    title: "Applied Cryptography",
    subtitle: "University of London",
    description: "Learned cryptographic techniques and their applications in securing data.",
    link: "https://www.coursera.org/account/accomplishments/certificate/ELWZU5RWLV4W",
    staticImage: "/img/applied-cryptography.png",
  },
  {
    title: "Smart Contracts",
    subtitle: "University at Buffalo",
    description: "Developed and deployed smart contracts on Ethereum.",
    link: "https://www.coursera.org/account/accomplishments/certificate/THERQRL7C763",
    staticImage: "/img/smart-contracts.png",
  },
  {
    title: "The Blockchain",
    subtitle: "University of California",
    description: "Explored the fundamentals of blockchain technology and its applications.",
    link: "https://www.coursera.org/account/accomplishments/certificate/FEBRJ5RB8J79",
    staticImage: "/img/blockchain.png",
  },
  {
    title: "Configuration Management",
    subtitle: "Google",
    description: "Learned configuration management and automation using Ansible.",
    link: "https://www.coursera.org/account/accomplishments/certificate/VCS9HP5LQU7H",
    staticImage: "/img/configuration-management.png",
  },
  {
    title: "Google IT Automation with Python",
    subtitle: "Google",
    description: "Learned scripting, automation, and troubleshooting across IT ecosystems.",
    link: "https://www.coursera.org/account/accomplishments/professional-cert/NEH8C9NZPCGX",
    staticImage: "/img/it-automation.png",
  },
];

export const myProjects: CardProps[] = [
  {
    title: "Phrase.Trade",
    subtitle: "Web3 NFT Dapp",
    description: "Built a text-based NFT marketplace on Arbitrum using React, Express, and Solidity.",
    icon: <FaCode />,
    link: "https://www.phrase.trade",
  },
  {
    title: "Rewardroot",
    subtitle: "Survey Platform",
    description: "Developed a website that seamlessly integrated multiple offerwalls and survey providers, attracting and securing over 1,000 users.",
    icon: <FaCode />,
    link: "https://www.rewardroot.com",
  },
  {
    title: "Social Bee",
    subtitle: "Social Media Manager",
    description: "Manage, schedule, and post content across multiple social media platforms with ease.",
    icon: <FaCode />,
    link: "https://www.socialbee.social",
  },
  {
    title: "Algora Call Bot",
    subtitle: "AI Call Automation",
    description: "AI-powered call bot providing precise buy signals for memecoins, built for degens by degens",
    icon: <FaCode />,
    link: "https://www.algoracallbot.com",
  }
];

export const websiteWorks = [
  "motilaloswalmf.com",
  "buffer.finance",
  "algoracallbot.com",
  "phrase.trade",
  "socialbee.social",
  "valetx.in",
  "rewardroot.com",
  "toskertail.com"
];
