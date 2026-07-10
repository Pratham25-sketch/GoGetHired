import React from "react";
import { useNavigate } from "react-router";
import {
  useUser,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";
import "../style/dashboard-navbar.scss";

const DashboardNavbar = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar__container">
        {/* Left Side: Back Navigation */}
        <div className="dashboard-navbar__left" style={{ flex: 1 }}>
          <button
            className="navbar-btn navbar-btn--back"
            onClick={() => navigate("/dashboard")}
            aria-label="Go back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>

        {/* Center: Logo and App Name */}
        <div className="dashboard-navbar__center" style={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/gogethired.png" alt="GoGetHired Logo" style={{ height: "62px", width: "auto", borderRadius: "8px" }} />
            <div style={{ display: "flex", alignItems: "center", fontSize: "2.35rem", fontWeight: "700", letterSpacing: "-0.5px" }}>
              <span style={{ color: "#fff" }}>GoGet</span>
              <span style={{ color: "#ff2d78" }}>Hired</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Controls */}
        <div className="dashboard-navbar__right" style={{ flex: 1, justifyContent: "flex-end" }}>
          <a
            href="https://prathams-portfolio-224u.onrender.com/"
            target="_blank"
            rel="noreferrer"
            className="navbar-btn navbar-btn--ghost"
            style={{ 
              textDecoration: "none", 
              marginRight: "12px", 
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
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "#7d8590";
            }}
            onMouseOut={(e) => {
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
          
          {!isLoaded ? null : !isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="navbar-btn navbar-btn--ghost">Log in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="navbar-btn navbar-btn--primary">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          ) : (
            <UserButton
              showName={true}
              appearance={{
                elements: {
                  userButtonTrigger: "user-badge-trigger",
                  avatarBox: "navbar-avatar",
                },
              }}
            />
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
