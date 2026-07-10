import React, { useState, useRef } from "react";
import "../style/resume-optimizer.scss";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router";
import { optimizeResumeContent } from "../services/tools.api";

const ResumeOptimizer = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [parsedResume, setParsedResume] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState(null);
  const resumeInputRef = useRef();

  // ── Output state ────────────────────────────────────────────────────────────
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Section expand state ────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState({
    education: true,
    experience: true,
    projects: true,
    skills: true,
  });

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Parse resume PDF ────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileName(file.name);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/interview/parse-resume`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to parse resume");
      }

      const data = await response.json();
      setParsedResume(data.parsedResume);
      setResumeText(data.resumeText);
    } catch (err) {
      setError(err.message || "Failed to parse resume PDF.");
      setSelectedFileName(null);
    }
  };

  // ── Generate optimized resume ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setError(null);

    if (!parsedResume) {
      setError("Please upload a resume PDF first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Job description is required.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = await getToken();
      const data = await optimizeResumeContent({
        parsedResume,
        jobDescription: jobDescription.trim(),
        targetRole: targetRole.trim() || null,
        token,
      });
      setResult(data);
    } catch (err) {
      console.error("[ResumeOptimizer] Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to optimize resume. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadDesignPreservedResumePdf = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/resume/pdf/design-preserved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            originalResumeText: resumeText,
            optimizedSections: result.optimized_resume,
            candidateInfo: parsedResume?.personalInfo || {},
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Optimized_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ResumeOptimizer] Download error:", err);
      setError("Failed to download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Chevron SVG ─────────────────────────────────────────────────────────────
  const ChevronSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
  );

  // ── Score color helper ──────────────────────────────────────────────────────
  const scoreClass = (score) =>
    score >= 75 ? "ro-ats-score__value--high" : score >= 50 ? "ro-ats-score__value--mid" : "ro-ats-score__value--low";

  return (
    <div className="resume-optimizer-page">
      {/* Header */}
      <header className="ro-header">
        <button className="ro-header__back" onClick={() => navigate("/dashboard")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Dashboard
        </button>
        <h1>
          Resume <span className="highlight">Optimizer</span>
        </h1>
        <p>
         Enhance your resume content for ATS and job relevance using AI-driven analysis.
        </p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="ro-error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Input Card */}
      {!result && !loading && (
        <div className="ro-input-card">
          {/* Resume Upload */}
          <div className="ro-field">
            <label className="ro-field__label">
              Resume PDF
              <span className="badge badge--required">Required</span>
            </label>
            {parsedResume ? (
              <div className="ro-resume-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Resume parsed: {parsedResume.skills?.length || 0} skills,{" "}
                {parsedResume.experience?.length || 0} roles,{" "}
                {parsedResume.education?.length || 0} education entries — {selectedFileName}
                <button
                  onClick={() => { setParsedResume(null); setSelectedFileName(null); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#7d8590", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  Change
                </button>
              </div>
            ) : (
              <label
                htmlFor="ro-resume-upload"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "1.5rem 1rem",
                  backgroundColor: "#1e2535",
                  border: "2px dashed #2a3348",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "#7d8590",
                  transition: "border-color 0.2s",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                <span style={{ fontWeight: 500, color: "#e6edf3" }}>Click to upload resume PDF</span>
                <span style={{ fontSize: "0.75rem" }}>PDF only • Max 5MB</span>
                <input
                  ref={resumeInputRef}
                  id="ro-resume-upload"
                  type="file"
                  accept=".pdf"
                  hidden
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>

          {/* Target Role */}
          <div className="ro-field">
            <label className="ro-field__label">
              Target Role
              <span className="badge badge--optional">Optional</span>
            </label>
            <input
              className="ro-field__input"
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          {/* Job Description */}
          <div className="ro-field">
            <label className="ro-field__label">
              Job Description
              <span className="badge badge--required">Required</span>
            </label>
            <textarea
              className="ro-field__textarea"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ minHeight: "160px" }}
            />
          </div>

          {/* Generate Button */}
          <div className="ro-generate-row">
            <span className="ro-generate-hint">AI-Powered • 20–40s</span>
            <button
              className="ro-generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              
              Optimize My Resume
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="ro-loading">
          <div className="ro-loading__spinner" />
          <p>Analyzing your resume against the job description…</p>
          <p>Improving bullet points, skills, and keywords — 20–40s</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="ro-results">
          <div className="ro-results-header">
            <h2>Optimized Resume</h2>
            {result.atsScore != null && (
              <div className="ro-ats-score">
                <span className="ro-ats-score__label">ATS Score</span>
                <span className={`ro-ats-score__value ${scoreClass(result.atsScore)}`}>
                  {result.atsScore}
                </span>
                <span className="ro-ats-score__suffix">/ 100</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="ro-summary">
              <p className="ro-summary__label">Professional Summary</p>
              <p className="ro-summary__text">{result.summary}</p>
            </div>
          )}

          {/* Education */}
          {result.optimized_resume?.education?.length > 0 && (
            <div className="ro-section-card">
              <div className="ro-section-card__header" onClick={() => toggleSection("education")}>
                <div className="ro-section-card__title">
                  <span className="ro-section-card__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" /></svg>
                  </span>
                  Education
                  <span className="ro-section-card__count">{result.optimized_resume.education.length}</span>
                </div>
                <span className={`ro-section-card__chevron ${expandedSections.education ? "ro-section-card__chevron--open" : ""}`}>
                  <ChevronSvg />
                </span>
              </div>
              {expandedSections.education && (
                <div className="ro-section-card__body">
                  {result.optimized_resume.education.map((edu, i) => (
                    <div key={i} className="ro-edu-entry">
                      <div className="ro-edu-entry__header">
                        <span className="ro-edu-entry__degree">
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </span>
                        <span className="ro-edu-entry__year">{edu.year}</span>
                      </div>
                      <p className="ro-edu-entry__institution">{edu.institution}</p>
                      {edu.gpa && <p style={{ fontSize: "0.78rem", color: "#7d8590" }}>GPA: {edu.gpa}</p>}
                      {edu.highlights?.length > 0 && (
                        <ul className="ro-edu-entry__highlights">
                          {edu.highlights.map((h, j) => <li key={j}>{h}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience */}
          {result.optimized_resume?.experience?.length > 0 && (
            <div className="ro-section-card">
              <div className="ro-section-card__header" onClick={() => toggleSection("experience")}>
                <div className="ro-section-card__title">
                  <span className="ro-section-card__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  </span>
                  Experience
                  <span className="ro-section-card__count">{result.optimized_resume.experience.length}</span>
                </div>
                <span className={`ro-section-card__chevron ${expandedSections.experience ? "ro-section-card__chevron--open" : ""}`}>
                  <ChevronSvg />
                </span>
              </div>
              {expandedSections.experience && (
                <div className="ro-section-card__body">
                  {result.optimized_resume.experience.map((exp, i) => (
                    <div key={i} className="ro-exp-entry">
                      <div className="ro-exp-entry__header">
                        <span className="ro-exp-entry__role">{exp.role}</span>
                        <span className="ro-exp-entry__duration">{exp.duration}</span>
                      </div>
                      <p className="ro-exp-entry__company">{exp.company}</p>
                      {exp.bullets?.length > 0 && (
                        <ul className="ro-exp-entry__bullets">
                          {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {result.optimized_resume?.projects?.length > 0 && (
            <div className="ro-section-card">
              <div className="ro-section-card__header" onClick={() => toggleSection("projects")}>
                <div className="ro-section-card__title">
                  <span className="ro-section-card__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                  </span>
                  Projects
                  <span className="ro-section-card__count">{result.optimized_resume.projects.length}</span>
                </div>
                <span className={`ro-section-card__chevron ${expandedSections.projects ? "ro-section-card__chevron--open" : ""}`}>
                  <ChevronSvg />
                </span>
              </div>
              {expandedSections.projects && (
                <div className="ro-section-card__body">
                  {result.optimized_resume.projects.map((proj, i) => (
                    <div key={i} className="ro-proj-entry">
                      <div className="ro-proj-entry__header">
                        <span className="ro-proj-entry__name">{proj.name}</span>
                        {proj.link && (
                          <a className="ro-proj-entry__link" href={proj.link} target="_blank" rel="noopener noreferrer">
                            ↗ Link
                          </a>
                        )}
                      </div>
                      {proj.techStack?.length > 0 && (
                        <div className="ro-proj-entry__tech">
                          {proj.techStack.map((t, j) => (
                            <span key={j} className="ro-proj-entry__tech-tag">{t}</span>
                          ))}
                        </div>
                      )}
                      {proj.bullets?.length > 0 && (
                        <ul className="ro-proj-entry__bullets">
                          {proj.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {result.optimized_resume?.skills?.length > 0 && (
            <div className="ro-section-card">
              <div className="ro-section-card__header" onClick={() => toggleSection("skills")}>
                <div className="ro-section-card__title">
                  <span className="ro-section-card__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </span>
                  Skills
                  <span className="ro-section-card__count">{result.optimized_resume.skills.length}</span>
                </div>
                <span className={`ro-section-card__chevron ${expandedSections.skills ? "ro-section-card__chevron--open" : ""}`}>
                  <ChevronSvg />
                </span>
              </div>
              {expandedSections.skills && (
                <div className="ro-section-card__body">
                  <div className="ro-skills-grid">
                    {result.optimized_resume.skills.map((skill, i) => (
                      <span key={i} className="ro-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Changes */}
          {result.keyChanges?.length > 0 && (
            <div className="ro-changes">
              <p className="ro-changes__label">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Key Changes Made ({result.keyChanges.length})
              </p>
              <ul className="ro-changes__list">
                {result.keyChanges.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Download PDFs */}
          <div className="ats-download-row">
            <button
              className="ats-download-btn"
              onClick={downloadDesignPreservedResumePdf}
              disabled={loading}
            >
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
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
               Download Optimised Resume PDF
            </button>
            <button
              className="ats-rerun-btn"
              onClick={() => setResult(null)}
              disabled={loading}
            >
              Re-run Optimisation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeOptimizer;
