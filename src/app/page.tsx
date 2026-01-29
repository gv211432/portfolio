"use client";

const subdomains = [
  { name: "me", label: "Portfolio", description: "Personal portfolio & experience" },
  { name: "opensource", label: "Open Source", description: "Our open source projects" },
  { name: "vision", label: "Vision", description: "Company vision & mission" },
  { name: "casestudy", label: "Case Studies", description: "Success stories & solutions" },
  { name: "whitelabel", label: "Products", description: "Ready-made solutions" },
  { name: "blogs", label: "Blog", description: "Insights & articles" },
  { name: "careers", label: "Careers", description: "Join our team" },
  { name: "ngo", label: "NGO", description: "Social initiatives" },
];

export default function LandingPage() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = rootDomain.includes("localhost") ? "http" : "https";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "bold",
              marginBottom: "24px",
              background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Gaurav.one
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#a0aec0", maxWidth: "600px", margin: "0 auto" }}>
            Building exceptional digital experiences. From blockchain solutions to full-stack applications.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
            marginBottom: "80px",
          }}
        >
          {subdomains.map((sub) => (
            <a
              key={sub.name}
              href={`${protocol}://${sub.name}.${rootDomain}`}
              style={{
                display: "block",
                padding: "24px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                color: "#fff",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "#764ba2";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "8px" }}>
                {sub.label}
              </h3>
              <p style={{ color: "#a0aec0", fontSize: "0.875rem", marginBottom: "16px" }}>
                {sub.description}
              </p>
              <div style={{ fontSize: "0.75rem", color: "#718096" }}>
                {sub.name}.gaurav.one
              </div>
            </a>
          ))}
        </div>

        {/* Footer Links */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#718096", marginBottom: "16px" }}>Connect with us</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
            <a
              href="https://github.com/AstroX11"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a0aec0", textDecoration: "none" }}
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/AstroX11"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a0aec0", textDecoration: "none" }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
