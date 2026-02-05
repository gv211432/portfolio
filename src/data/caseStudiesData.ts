// Case Studies Data

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  industry: CaseStudyIndustry;
  icon: string;
  gradient: string;
  logo?: string;
  clientName: string;
  clientRole?: string;
  // Snapshot section
  snapshot: {
    industry: string;
    techStack: string[];
    timeline: string;
    keyResult: string;
    keyResultLabel: string;
  };
  // Challenge section
  challenge: {
    title: string;
    description: string;
    painPoints: string[];
  };
  // Solution section
  solution: {
    title: string;
    description: string;
    approach: string[];
    technicalHighlights?: string[];
  };
  // Impact section
  impact: {
    title: string;
    description: string;
    metrics: {
      value: string;
      label: string;
      description?: string;
    }[];
  };
  // Testimonial
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    company: string;
    avatar?: string;
  };
  // Additional
  featured?: boolean;
  heroImage?: string;
  screenshots?: string[];
  liveUrl?: string;
  completedAt?: string;
}

export type CaseStudyIndustry =
  | "fintech"
  | "crypto"
  | "saas"
  | "ecommerce"
  | "social"
  | "gaming";

export const industryInfo: Record<
  CaseStudyIndustry,
  { label: string; color: string; bgColor: string; }
> = {
  fintech: {
    label: "FinTech",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/30",
  },
  crypto: {
    label: "Crypto/Web3",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10 border-purple-400/30",
  },
  saas: {
    label: "SaaS",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30",
  },
  ecommerce: {
    label: "E-commerce",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30",
  },
  social: {
    label: "Social",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10 border-pink-400/30",
  },
  gaming: {
    label: "Gaming",
    color: "text-cyan",
    bgColor: "bg-cyan/10 border-cyan/30",
  },
};

export const caseStudies: CaseStudy[] = [
  {
    id: "rewardroot",
    slug: "rewardroot",
    title: "Rewardroot.com - Survey Platform",
    shortTitle: "Rewardroot",
    tagline: "From Zero to 20x ROI in 4 Months",
    description:
      "A comprehensive survey and rewards platform that aggregates multiple offerwalls, surveys, and games into a single user-friendly interface.",
    industry: "fintech",
    icon: "FaCoins",
    gradient: "from-emerald-500 to-teal-600",
    clientName: "Opinosoft Pvt Ltd",
    clientRole: "Atul & Dhanesh",
    snapshot: {
      industry: "FinTech / Rewards",
      techStack: ["Next.js", "PostgreSQL", "Node.js", "Redis", "AWS"],
      timeline: "4 months",
      keyResult: "20x",
      keyResultLabel: "Return on Investment",
    },
    challenge: {
      title: "Building a Scalable Rewards Ecosystem",
      description:
        "The client wanted to create a platform where they could aggregate multiple offerwalls, surveys, and games - allowing users to earn rewards through various activities. The challenge was building a system that could handle complex S2S (Server-to-Server) callbacks from multiple providers while maintaining accurate user balances and providing real-time earnings tracking.",
      painPoints: [
        "Complex integration requirements with multiple offerwall providers",
        "Need for real-time earnings tracking and accurate balance management",
        "Scalable architecture to handle thousands of concurrent users",
        "Admin dashboard for managing S2S URL configurations dynamically",
        "Fraud prevention and duplicate callback detection",
      ],
    },
    solution: {
      title: "Full-Stack Rewards Platform with Dynamic S2S Management",
      description:
        "We architected and delivered a complete rewards platform with a custom S2S callback system that allowed admins to configure integration paths without code changes. The platform featured real-time balance updates, comprehensive earnings history, and a fraud detection layer.",
      approach: [
        "Built custom S2S callback handler supporting multiple offerwall formats",
        "Implemented real-time balance updates using PostgreSQL triggers and WebSocket connections",
        "Created admin dashboard for dynamic S2S URL path configuration",
        "Developed comprehensive user portal with earnings breakdown and withdrawal management",
        "Implemented Redis caching for high-frequency balance queries",
      ],
      technicalHighlights: [
        "PostgreSQL for ACID-compliant transaction management",
        "Custom middleware for S2S signature verification",
        "Redis queue for processing high-volume callbacks",
        "Next.js for SEO-optimized public pages and dynamic dashboard",
      ],
    },
    impact: {
      title: "Exceptional ROI and Business Success",
      description:
        "The platform exceeded all expectations, allowing the client to recover their investment quickly and generate significant returns before regulatory changes affected the market.",
      metrics: [
        {
          value: "20x",
          label: "ROI",
          description: "Return on initial investment",
        },
        {
          value: "4",
          label: "Months",
          description: "From concept to profitable launch",
        },
        {
          value: "10+",
          label: "Integrations",
          description: "Offerwall and survey providers connected",
        },
        {
          value: "99.9%",
          label: "Uptime",
          description: "Platform availability during peak traffic",
        },
      ],
    },
    testimonial: {
      quote:
        "Gaurav and his team delivered exactly what we envisioned. The platform was robust, scalable, and helped us achieve returns we never expected. They're not just developers; they're partners who understand business.",
      author: "Atul & Dhanesh",
      role: "Founders",
      company: "Opinosoft Pvt Ltd",
    },
    featured: true,
    completedAt: "2023",
  },
  {
    id: "algora-call-bot",
    slug: "algora-call-bot",
    title: "Algora Call Bot - Telegram Trading Signals",
    shortTitle: "Algora Call Bot",
    tagline: "Turning Setback into $100K+ MRR Success",
    description:
      "A premium Telegram trading signal bot serving 700+ active subscribers at $200/month, with real-time performance tracking and analytics dashboard.",
    industry: "crypto",
    icon: "FaTelegram",
    gradient: "from-blue-500 to-indigo-600",
    clientName: "Ralph Mendez",
    snapshot: {
      industry: "Crypto / Trading",
      techStack: [
        "Node.js",
        "Telegram Bot API",
        "Birdeye API",
        "SHYFT",
        "Next.js",
        "MongoDB",
      ],
      timeline: "3 months",
      keyResult: "$140K+",
      keyResultLabel: "Monthly Recurring Revenue",
    },
    challenge: {
      title: "Rebuilding Trust After Developer Theft",
      description:
        "When Ralph discovered us on Upwork, he was almost broke. His former developer had stolen assets and left the bot in a barely functional state. The operational costs were bleeding money, with Birdeye API calls alone costing over $5,000/month. The bot had potential with 3,000+ followers but needed complete restructuring.",
      painPoints: [
        "Former developer had stolen assets and compromised the system",
        "Operational costs exceeding $5,000/month for API calls",
        "No performance tracking or analytics for subscribers",
        "Unreliable signal delivery affecting user trust",
        "No website or marketing presence to grow subscriber base",
      ],
    },
    solution: {
      title: "Complete Platform Rebuild with Cost Optimization",
      description:
        "We conducted a full security audit, rebuilt the bot infrastructure with optimized API usage, and created a professional website showcasing call performance. Our optimization reduced operational costs by 40% while improving signal delivery reliability.",
      approach: [
        "Conducted security audit and identified the former developer's theft",
        "Optimized Birdeye and SHYFT API calls reducing costs by 40%",
        "Built performance tracking dashboard for transparent signal history",
        "Created marketing website with real-time call performance display",
        "Implemented subscription management with automated renewals",
      ],
      technicalHighlights: [
        "Smart caching layer reducing API calls by 60%",
        "Real-time P&L tracking with historical performance graphs",
        "Automated subscription lifecycle management",
        "Rate limiting and cost monitoring alerts",
      ],
    },
    impact: {
      title: "From Near Bankruptcy to Six-Figure MRR",
      description:
        "Ralph's story is a testament to resilience. With the optimized bot and new website, active subscribers grew from 500 to 700+, generating over $140K in monthly recurring revenue.",
      metrics: [
        {
          value: "$140K+",
          label: "MRR",
          description: "Monthly recurring revenue",
        },
        {
          value: "700+",
          label: "Active Users",
          description: "Paying $200/month each",
        },
        {
          value: "40%",
          label: "Cost Reduction",
          description: "In operational expenses",
        },
        {
          value: "3,000+",
          label: "Followers",
          description: "Total community size",
        },
      ],
    },
    testimonial: {
      quote:
        "When I found Gaurav, I was ready to give up. Not only did they rebuild everything, but they also uncovered what my previous developer had done. Their work turned my disaster into a thriving business. Never settle down out of setbacks - keep grinding.",
      author: "Ralph Mendez",
      role: "Founder",
      company: "Algora Trading",
    },
    featured: true,
    completedAt: "2024",
  },
  {
    id: "buffer-finance",
    slug: "buffer-finance",
    title: "Buffer.Finance - DeFi Futures Platform",
    shortTitle: "Buffer Finance",
    tagline: "2x User Growth with Enhanced Trading UX",
    description:
      "UI enhancement and platform optimization for a decentralized futures trading platform powered by their own liquidity pool (BLP).",
    industry: "crypto",
    icon: "TbChartCandle",
    gradient: "from-purple-500 to-pink-600",
    clientName: "Buffer Finance Team",
    liveUrl: "https://trade.supurr.app",
    snapshot: {
      industry: "DeFi / Trading",
      techStack: ["React", "Web3.js", "Solidity", "The Graph", "AWS"],
      timeline: "2 months",
      keyResult: "2x",
      keyResultLabel: "New User Acquisition",
    },
    challenge: {
      title: "Improving UX for Complex DeFi Trading",
      description:
        "Buffer Finance had a working futures trading platform but was struggling with user acquisition and retention. The existing UI was functional but not intuitive for new users entering DeFi trading. They needed to make the platform more accessible while maintaining the advanced features power users expected.",
      painPoints: [
        "Complex trading interface deterring new users",
        "Low conversion rate from visitors to active traders",
        "Liquidity pool (BLP) mechanics not clearly explained",
        "Mobile experience was suboptimal",
        "Performance issues during high-volume trading periods",
      ],
    },
    solution: {
      title: "UX-Driven Platform Enhancement",
      description:
        "We redesigned the trading interface with a focus on progressive disclosure - simple for beginners, powerful for experts. Enhanced the BLP visualization to help users understand pool mechanics and their potential yields.",
      approach: [
        "Redesigned trading dashboard with clearer position management",
        "Created interactive BLP visualization showing real-time pool stats",
        "Implemented guided onboarding flow for new users",
        "Optimized mobile trading experience",
        "Added real-time APY calculations and yield projections",
      ],
      technicalHighlights: [
        "React component optimization reducing render times by 50%",
        "WebSocket integration for real-time price updates",
        "The Graph integration for efficient historical data queries",
        "Progressive Web App features for mobile trading",
      ],
    },
    impact: {
      title: "Doubled User Base with Improved Retention",
      description:
        "The UI improvements led to significant growth in user acquisition and engagement. The BLP pools saw increased participation with APY reaching 70%, demonstrating user confidence in the platform.",
      metrics: [
        {
          value: "2x",
          label: "User Growth",
          description: "New user acquisition doubled",
        },
        {
          value: "70%",
          label: "Pool APY",
          description: "BLP yield at peak performance",
        },
        {
          value: "95%",
          label: "Managed IO",
          description: "Users managing positions with pools",
        },
        {
          value: "50%",
          label: "Faster UI",
          description: "Render time improvements",
        },
      ],
    },
    testimonial: {
      quote:
        "The team understood DeFi trading inside out. Their UI improvements weren't just cosmetic - they fundamentally changed how users interact with our platform. The results speak for themselves.",
      author: "Buffer Finance Team",
      role: "Core Contributors",
      company: "Buffer Finance / Suppur",
    },
    featured: true,
    completedAt: "2024",
  },
];

// Helper functions
export const getCaseStudyBySlug = (slug: string): CaseStudy | undefined => {
  return caseStudies.find((cs) => cs.slug === slug);
};

export const getFeaturedCaseStudies = (): CaseStudy[] => {
  return caseStudies.filter((cs) => cs.featured);
};

export const getCaseStudiesByIndustry = (
  industry: CaseStudyIndustry
): CaseStudy[] => {
  return caseStudies.filter((cs) => cs.industry === industry);
};
