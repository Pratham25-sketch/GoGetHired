import React from "react";
import { useNavigate } from "react-router";
import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";
import "../style/landing.scss";

const Landing = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const handleGetStarted = () => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    } else {
      navigate("/sign-in");
    }
  };

  return (
    <div className="landing-page">
      {/* Top Bar Navigation */}
      <nav className="top-bar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/gogethired.png" alt="GoGetHired Logo" style={{ height: "62px", width: "auto", borderRadius: "10px" }} />
          <div style={{ display: "flex", alignItems: "center", fontSize: "2.35rem", fontWeight: "700", letterSpacing: "-0.5px" }}>
            <span className="word-go">GoGet</span>
            <span className="word-hired">Hired</span>
          </div>
        </div>
        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="https://prathams-portfolio-224u.onrender.com/"
            target="_blank"
            rel="noreferrer"
            style={{ 
              textDecoration: "none", 
              color: "#e6edf3", 
              fontSize: "0.9rem", 
              fontWeight: "500", 
              marginRight: "8px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              border: "1px solid #2a3348",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.02)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "#7d8590";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#e6edf3";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.borderColor = "#2a3348";
            }}
          >
            <img 
              src="/content.png" 
              alt="Creator" 
              style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: "1px solid #2a3348" }} 
            />
            About the Creator
          </a>
          {!isLoaded ? (
            /* Skeleton placeholder while Clerk loads */
            <div className="nav-auth-skeleton" />
          ) : isSignedIn ? (
            /* ── Signed In: UserButton + Dashboard link ── */
            <>
              <button
                className="btn btn-secondary btn--sm"
                onClick={() => navigate("/dashboard")}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px" }}
              >
                <img 
                  src="/dashboard.png" 
                  alt="Dashboard" 
                  style={{ width: "30px", height: "30px", borderRadius: "5px", objectFit: "cover" }} 
                />
                Dashboard
              </button>
              <div className="nav-user-btn">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: "36px",
                        height: "36px",
                      },
                    },
                  }}
                />
              </div>
            </>
          ) : (
            /* ── Signed Out: Sign In + Sign Up buttons ── */
            <>

              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <button className="btn btn-primary btn--sm" id="nav-sign-up">
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="badge">AI-Powered Career Toolkit</div>
        <h1>
          Land Your Dream Job with <br />
          <span className="highlight">Intelligent Preparation</span>
        </h1>
        <p>
          Optimize your resume, master your interviews, and automate cold outreach with
          the ultimate AI job prep platform. Tailored for maximum success.
        </p>
        <div className="cta-group">
          {isSignedIn ? (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <button className="btn btn-primary">Get Started For Free</button>
              </SignUpButton>

            </>
          )}
        </div>
      </header>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2>How It Works</h2>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload Resume</h3>
            <p style={{ color: "#7d8590", fontSize: "0.9rem", marginTop: "0.5rem" }}>Provide your baseline context.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Analyze Job Description</h3>
            <p style={{ color: "#7d8590", fontSize: "0.9rem", marginTop: "0.5rem" }}>Target specific roles.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get AI Insights</h3>
            <p style={{ color: "#7d8590", fontSize: "0.9rem", marginTop: "0.5rem" }}>Receive customized strategy.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Prepare and Get Hired</h3>
            <p style={{ color: "#7d8590", fontSize: "0.9rem", marginTop: "0.5rem" }}>Crack interviews. Get hired</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Everything you need to succeed</h2>
          <p>We provide a comprehensive suite of AI tools designed to cover every stage of the application process.</p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3>AI Resume Optimization</h3>
            <p>Automatically tailor your resume to perfectly match specific job descriptions and bypass ATS filters.</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3>Skill Gap Detection</h3>
            <p>Identify precisely what skills you're missing from the job description before you even apply.</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3>AI Interview Questions</h3>
            <p>Anticipate the exact questions you'll be asked based on company size, role, and industry.</p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3>Behavioral & Technical Prep</h3>
            <p>Practice both soft skills and rigorous technical implementation questions for your target position.</p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Cold Email Generator</h3>
            <p>Generate highly personalized outreach emails to recruiters, hiring managers, and potential referrals.</p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Optimized Resume Export</h3>
            <p>Get your enhanced resume with refined content tailored to match your target job requirements.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to land your next role?</h2>
        <p>Join professionals optimizing their career trajectory with intelligent, AI-driven preparation.</p>
        {isSignedIn ? (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
            style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}
          >
            Go to Dashboard
          </button>
        ) : (
          <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
            <button
              className="btn btn-primary"
              style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}
            >
              Start Preparing Now
            </button>
          </SignUpButton>
        )}
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="copyright">
          © {new Date().getFullYear()} GoGetHired Inc. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
