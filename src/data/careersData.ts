// Careers Data

export type JobType = "full-time" | "part-time" | "contract" | "remote";
export type JobDepartment = "engineering" | "design" | "security" | "devops";

export interface JobPosition {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  department: JobDepartment;
  type: JobType;
  location: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  techStack: string[];
  gradient: string;
  icon: string;
  featured?: boolean;
}

export const departmentInfo: Record<JobDepartment, { label: string; color: string; bgColor: string }> = {
  engineering: {
    label: "Engineering",
    color: "text-cyan",
    bgColor: "bg-cyan/10 border-cyan/30",
  },
  design: {
    label: "Design",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/30",
  },
  security: {
    label: "Security",
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30",
  },
  devops: {
    label: "DevOps",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30",
  },
};

export const jobTypeInfo: Record<JobType, { label: string; color: string }> = {
  "full-time": { label: "Full-time", color: "text-green-400" },
  "part-time": { label: "Part-time", color: "text-blue-400" },
  contract: { label: "Contract", color: "text-purple-400" },
  remote: { label: "Remote", color: "text-cyan" },
};

export const jobPositions: JobPosition[] = [
  {
    id: "fullstack-web3-developer",
    slug: "fullstack-web3-developer",
    title: "Full Stack Web3 Developer",
    shortTitle: "Full Stack Web3",
    department: "engineering",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "We're looking for a Full Stack Web3 Developer who can build end-to-end decentralized applications. You'll work on smart contracts, backend services, and modern frontend interfaces. The ideal candidate has shipped Web3 products and understands the entire blockchain development lifecycle.",
    responsibilities: [
      "Build and deploy smart contracts on Solana, Ethereum, and Sui",
      "Develop responsive web applications with React/Next.js",
      "Create backend APIs using Node.js/NestJS/FastAPI",
      "Integrate Web3 wallets and blockchain interactions",
      "Write clean, maintainable, and well-tested code",
      "Collaborate with designers and product managers",
      "Participate in code reviews and technical discussions",
    ],
    requirements: [
      "3+ years of full-stack development experience",
      "Strong proficiency in TypeScript/JavaScript",
      "Experience with React/Next.js and Node.js",
      "Familiarity with smart contract development",
      "Understanding of blockchain fundamentals",
      "Proven track record of delivering projects",
      "Excellent problem-solving skills",
    ],
    niceToHave: [
      "Experience with Solana/Anchor framework",
      "Knowledge of DeFi protocols",
      "Contributions to open-source projects",
      "Experience with GraphQL",
      "Mobile development experience",
    ],
    techStack: ["TypeScript", "React", "Next.js", "Node.js", "Solidity", "Rust", "PostgreSQL", "Redis"],
    gradient: "from-cyan-500 to-blue-600",
    icon: "FaCode",
    featured: true,
  },
  {
    id: "solidity-solana-developer",
    slug: "solidity-solana-developer",
    title: "Solidity/Solana Smart Contract Developer",
    shortTitle: "Smart Contracts",
    department: "engineering",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "Join us as a Smart Contract Developer specializing in Solidity and Solana. You'll architect and implement secure, gas-efficient smart contracts for DeFi protocols, NFT platforms, and cross-chain bridges. Security and optimization are paramount.",
    responsibilities: [
      "Design and implement smart contracts in Solidity and Rust",
      "Conduct security audits and vulnerability assessments",
      "Optimize contracts for gas efficiency",
      "Write comprehensive test suites for all contracts",
      "Document contract architecture and interfaces",
      "Collaborate on protocol design decisions",
      "Stay updated with latest blockchain security practices",
    ],
    requirements: [
      "2+ years of smart contract development",
      "Deep expertise in Solidity or Rust/Anchor",
      "Strong understanding of EVM and Solana runtime",
      "Experience with contract security best practices",
      "Familiarity with common attack vectors",
      "Track record of deployed mainnet contracts",
      "Strong algorithmic thinking",
    ],
    niceToHave: [
      "Experience with formal verification",
      "Knowledge of MEV and flashloans",
      "Cross-chain bridge development",
      "DeFi protocol experience",
      "Security audit experience",
    ],
    techStack: ["Solidity", "Rust", "Anchor", "Hardhat", "Foundry", "OpenZeppelin", "Web3.js", "Ethers.js"],
    gradient: "from-purple-500 to-indigo-600",
    icon: "FaFileContract",
    featured: true,
  },
  {
    id: "ui-ux-designer",
    slug: "ui-ux-designer",
    title: "UI/UX Figma Designer",
    shortTitle: "UI/UX Designer",
    department: "design",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "We're seeking a talented UI/UX Designer who can create beautiful, intuitive interfaces for Web3 applications. You'll design user experiences that make complex blockchain interactions simple and delightful. Figma expertise is essential.",
    responsibilities: [
      "Design user interfaces for Web3 applications",
      "Create wireframes, prototypes, and high-fidelity mockups",
      "Develop and maintain design systems",
      "Conduct user research and usability testing",
      "Collaborate with developers on implementation",
      "Create responsive designs for all screen sizes",
      "Design marketing materials and landing pages",
    ],
    requirements: [
      "3+ years of UI/UX design experience",
      "Expert proficiency in Figma",
      "Strong portfolio of Web/Mobile designs",
      "Understanding of design systems",
      "Experience with responsive design",
      "Ability to translate complex flows into simple UX",
      "Strong visual design skills",
    ],
    niceToHave: [
      "Experience designing for Web3/DeFi",
      "Motion design skills",
      "Illustration abilities",
      "Front-end development knowledge",
      "Experience with design tokens",
    ],
    techStack: ["Figma", "Adobe Creative Suite", "Framer", "Principle", "Lottie", "Zeplin"],
    gradient: "from-pink-500 to-rose-600",
    icon: "FaPaintBrush",
  },
  {
    id: "devops-engineer",
    slug: "devops-engineer",
    title: "DevOps Engineer (AWS & GCP)",
    shortTitle: "DevOps Engineer",
    department: "devops",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "We need a DevOps Engineer to build and maintain our cloud infrastructure. You'll work with AWS and GCP to create scalable, secure, and cost-effective systems. Experience with blockchain node management is a plus.",
    responsibilities: [
      "Design and implement CI/CD pipelines",
      "Manage cloud infrastructure on AWS and GCP",
      "Implement infrastructure as code with Terraform",
      "Set up monitoring, alerting, and logging systems",
      "Ensure high availability and disaster recovery",
      "Optimize costs and resource utilization",
      "Manage blockchain node infrastructure",
    ],
    requirements: [
      "3+ years of DevOps/SRE experience",
      "Strong expertise in AWS and/or GCP",
      "Experience with Kubernetes and Docker",
      "Proficiency with Terraform or Pulumi",
      "Knowledge of CI/CD tools (GitHub Actions, Jenkins)",
      "Linux administration skills",
      "Scripting abilities (Bash, Python)",
    ],
    niceToHave: [
      "Experience running blockchain nodes",
      "Knowledge of security best practices",
      "Cost optimization experience",
      "Multi-cloud architecture experience",
      "Chaos engineering experience",
    ],
    techStack: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "GitHub Actions", "Prometheus", "Grafana"],
    gradient: "from-orange-500 to-amber-600",
    icon: "FaServer",
    featured: true,
  },
  {
    id: "cyber-security-engineer",
    slug: "cyber-security-engineer",
    title: "Cyber Security Engineer (Cryptography)",
    shortTitle: "Security Engineer",
    department: "security",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "Join our security team as a Cyber Security Engineer with expertise in cryptography. You'll ensure the security of our blockchain protocols, conduct penetration testing, and implement cryptographic solutions.",
    responsibilities: [
      "Conduct security assessments and penetration testing",
      "Review smart contract security",
      "Implement cryptographic protocols",
      "Design secure authentication systems",
      "Respond to security incidents",
      "Create security documentation and guidelines",
      "Train team on security best practices",
    ],
    requirements: [
      "3+ years of security engineering experience",
      "Deep knowledge of cryptographic primitives",
      "Experience with penetration testing",
      "Understanding of blockchain security",
      "Familiarity with common vulnerabilities (OWASP)",
      "Security certification (CISSP, CEH, OSCP) preferred",
      "Strong analytical skills",
    ],
    niceToHave: [
      "Smart contract auditing experience",
      "Bug bounty participation",
      "Malware analysis skills",
      "Reverse engineering experience",
      "Cryptographic research background",
    ],
    techStack: ["Burp Suite", "Metasploit", "Wireshark", "OpenSSL", "HSM", "Python", "Solidity"],
    gradient: "from-red-500 to-rose-600",
    icon: "FaShieldAlt",
  },
  {
    id: "frontend-developer",
    slug: "frontend-developer",
    title: "ReactJS/NextJS Frontend Developer",
    shortTitle: "Frontend Developer",
    department: "engineering",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "We're looking for a Frontend Developer specializing in React and Next.js. You'll build beautiful, performant user interfaces for our Web3 applications, working closely with designers and backend engineers.",
    responsibilities: [
      "Build responsive web applications with React/Next.js",
      "Implement pixel-perfect designs from Figma",
      "Optimize application performance",
      "Integrate with backend APIs and Web3 wallets",
      "Write unit and integration tests",
      "Maintain and improve existing codebases",
      "Collaborate on technical architecture decisions",
    ],
    requirements: [
      "2+ years of React/Next.js experience",
      "Strong proficiency in TypeScript",
      "Experience with state management (Zustand, Redux)",
      "Knowledge of CSS-in-JS or Tailwind CSS",
      "Understanding of web performance optimization",
      "Experience with responsive design",
      "Git proficiency",
    ],
    niceToHave: [
      "Web3 wallet integration experience",
      "Animation libraries (Framer Motion, GSAP)",
      "Testing experience (Jest, Cypress)",
      "SSR/SSG optimization knowledge",
      "Accessibility (a11y) expertise",
    ],
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Zustand", "Jest"],
    gradient: "from-blue-500 to-cyan-600",
    icon: "FaReact",
  },
  {
    id: "backend-developer",
    slug: "backend-developer",
    title: "FastAPI/NestJS Backend Developer",
    shortTitle: "Backend Developer",
    department: "engineering",
    type: "remote",
    location: "Worldwide (Remote)",
    description:
      "We need a Backend Developer proficient in FastAPI and/or NestJS. You'll build scalable APIs, integrate with blockchain networks, and ensure our backend services are reliable and performant.",
    responsibilities: [
      "Design and implement RESTful and GraphQL APIs",
      "Build microservices architecture",
      "Integrate with blockchain networks and indexers",
      "Implement authentication and authorization",
      "Optimize database queries and caching",
      "Write comprehensive API documentation",
      "Set up monitoring and logging",
    ],
    requirements: [
      "3+ years of backend development experience",
      "Strong proficiency in Python (FastAPI) or Node.js (NestJS)",
      "Experience with PostgreSQL and Redis",
      "Knowledge of API design best practices",
      "Understanding of microservices architecture",
      "Experience with message queues (RabbitMQ, Kafka)",
      "Docker and containerization knowledge",
    ],
    niceToHave: [
      "Experience with blockchain indexing",
      "GraphQL expertise",
      "WebSocket implementation experience",
      "Performance optimization skills",
      "Event-driven architecture experience",
    ],
    techStack: ["FastAPI", "NestJS", "Python", "TypeScript", "PostgreSQL", "Redis", "Docker", "RabbitMQ"],
    gradient: "from-green-500 to-emerald-600",
    icon: "FaDatabase",
  },
];

export const getJobBySlug = (slug: string): JobPosition | undefined => {
  return jobPositions.find((job) => job.slug === slug);
};

export const getJobsByDepartment = (department: JobDepartment): JobPosition[] => {
  return jobPositions.filter((job) => job.department === department);
};

export const getFeaturedJobs = (): JobPosition[] => {
  return jobPositions.filter((job) => job.featured);
};
