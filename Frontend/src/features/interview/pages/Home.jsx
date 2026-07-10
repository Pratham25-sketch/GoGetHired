import React, { useState, useRef } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/react";

import DashboardNavbar from "../../../components/DashboardNavbar.jsx";

const Home = () => {
  const { loading, generateReport, reports, removeReport, error, setError } =
    useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const resumeInputRef = useRef();
  const navigate = useNavigate();
  const { user } = useUser();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFileName(file ? file.name : null);
  };

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0];

    if (!jobDescription.trim()) {
      setError("Please enter a job description before generating your plan.");
      return;
    }

    if (!resumeFile && !selfDescription.trim()) {
      setError("Please upload a resume PDF or enter a self-description.");
      return;
    }

    setError(null);
    const data = await generateReport({
      jobDescription,
      selfDescription,
      resumeFile,
    });
    if (data?._id) {
      navigate(`/interview/${data._id}`);
    }
  };

  const handleDeleteReport = async (e, reportId) => {
    e.stopPropagation();
    if (window.confirm("Delete this report? This cannot be undone.")) {
      try {
        setDeletingIds((prev) => [...prev, reportId]);
        await removeReport(reportId);
      } finally {
        setDeletingIds((prev) => prev.filter((id) => id !== reportId));
      }
    }
  };

  return (
    <div className="home-page">
      <DashboardNavbar />

      {/* Page Header */}
      <header className="page-header">
        <h1>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Create
          Your <span className="highlight">Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
              stroke="#0d1117"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16"
              stroke="#0d1117"
              strokeWidth="2"
            />
          </svg>
          <span>{error}</span>
          <button
            className="error-banner__close"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

        {/* Quick Tools */}
      <section className="recent-reports" style={{ marginTop: reports.length > 0 ? 0 : undefined }}>
        <h2>Quick Tools</h2>
        <ul className="reports-list">
          <li
            className="report-item"
            onClick={() => navigate("/tools/resume-optimizer")}
            style={{ borderLeft: "3px solid #ff2d78" }}
          >
            <div className="report-item__header">
              <h3>📄 Resume Optimizer</h3>
            </div>
            <p className="report-meta">
              Improve your resume content with AI-powered optimization
            </p>
          </li>
          <li
            className="report-item"
            onClick={() => navigate("/tools/cold-emails")}
            style={{ borderLeft: "3px solid #ff6b9d" }}
          >
            <div className="report-item__header">
              <h3>✉️ Cold Email Generator</h3>
            </div>
            <p className="report-meta">
              Generate personalized outreach emails for your job applications
            </p>
          </li>
        </ul>
      </section>

      {/* Main Card */}
      <div className="interview-card">
        <div className="interview-card__body">
          {/* Left Panel - Job Description */}
          <div className="panel panel--left">
            <div className="panel__header">
              <span className="panel__icon">
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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </span>
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>
            <textarea
              onChange={(e) => setJobDescription(e.target.value)}
              value={jobDescription}
              className="panel__textarea"
              placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
              maxLength={5000}
            />
            <div
              className={`char-counter ${jobDescription.length > 4500 ? "char-counter--warn" : ""}`}
            >
              {jobDescription.length} / 5000 chars
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="panel-divider" />

          {/* Right Panel - Profile */}
          <div className="panel panel--right">
            <div className="panel__header">
              <span className="panel__icon">
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <h2>Your Profile</h2>
            </div>

            {/* Upload Resume */}
            <div className="upload-section">
              <label className="section-label">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>
              <label
                className={`dropzone ${selectedFileName ? "dropzone--selected" : ""}`}
                htmlFor="resume"
              >
                {selectedFileName ? (
                  <>
                    <span className="dropzone__icon dropzone__icon--success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <polyline points="9 15 11 17 15 13" />
                      </svg>
                    </span>
                    <p className="dropzone__title dropzone__title--success">
                      {selectedFileName}
                    </p>
                    <p className="dropzone__subtitle">Click to change file</p>
                  </>
                ) : (
                  <>
                    <span className="dropzone__icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                    </span>
                    <p className="dropzone__title">
                      Click to upload or drag &amp; drop
                    </p>
                    <p className="dropzone__subtitle">PDF only (Max 5MB)</p>
                  </>
                )}
                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* OR Divider */}
            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Quick Self-Description */}
            <div className="self-description">
              <label className="section-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                onChange={(e) => setSelfDescription(e.target.value)}
                value={selfDescription}
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
              />
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-box__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="276"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <p>
                Either a <strong>Resume PDF</strong> or a{" "}
                <strong>Self Description</strong> is required to generate a
                personalized plan.
              </p>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="interview-card__footer">
          <span className="footer-info">
            {loading
              ? "⏳ Generating your plan — this takes about 30s..."
              : "AI-Powered Strategy Generation • Approx 30s"}
          </span>
          <button
            onClick={handleGenerateReport}
            className="generate-btn"
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Generating...
              </>
            ) : (
              <>
               
                Generate My Interview Strategy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Reports List */}
      {reports.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>
          <ul className="reports-list">
            {reports.map((report) => (
              <li
                key={report._id}
                className={`report-item ${deletingIds.includes(report._id) ? "report-item--deleting" : ""}`}
                onClick={() => {
                  if (!deletingIds.includes(report._id)) {
                    navigate(`/interview/${report._id}`);
                  }
                }}
              >
                <div className="report-item__header">
                  <h3>{report.title || "Untitled Position"}</h3>
                  {deletingIds.includes(report._id) ? (
                    <span className="report-item__spinner">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ animation: "spin 1s linear infinite" }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </span>
                  ) : (
                    <button
                      className="report-item__delete"
                      onClick={(e) => handleDeleteReport(e, report._id)}
                      title="Delete report"
                      aria-label="Delete report"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="report-meta">
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
                {report.matchScore != null && (
                  <p
                    className={`match-score ${report.matchScore >= 80 ? "score--high" : report.matchScore >= 60 ? "score--mid" : "score--low"}`}
                  >
                    Match Score: {report.matchScore}%
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

    

      {/* Page Footer */}
      <footer className="page-footer">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Help Center</a>
      </footer>

      <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
};

export default Home;
