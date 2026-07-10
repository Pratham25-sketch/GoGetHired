import React, { useState, useRef } from "react";
import "../style/cold-emails.scss";
import { useAuth, useUser } from "@clerk/react";
import { useNavigate } from "react-router";
import { generateColdEmails } from "../services/tools.api";

const ColdEmails = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [parsedResume, setParsedResume] = useState(null);
  const resumeInputRef = useRef();
  const [selectedFileName, setSelectedFileName] = useState(null);

  // ── Output state ────────────────────────────────────────────────────────────
  const [emails, setEmails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // ── Parse resume PDF locally ────────────────────────────────────────────────
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

  // ── Generate cold emails ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError(null);

    // Build resume data from parsed resume or manual text
    let resumeData = parsedResume ? { ...parsedResume } : null;
    if (!resumeData && resumeText.trim()) {
      resumeData = { summary: resumeText.trim(), skills: [], experience: [], education: [] };
    }

    if (!resumeData) {
      setError("Please upload a resume PDF or paste your resume text.");
      return;
    }
    
    resumeData.personalInfo = {
      name: user?.fullName || "[Your Name]",
      email: user?.primaryEmailAddress?.emailAddress || "[Your Email]",
    };

    if (!jobDescription.trim()) {
      setError("Job description is required.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Target role is required.");
      return;
    }

    setLoading(true);
    setEmails(null);

    try {
      const token = await getToken();
      const result = await generateColdEmails({
        resumeData,
        jobDescription: jobDescription.trim(),
        targetRole: targetRole.trim(),
        companyName: companyName.trim() || null,
        token,
      });
      setEmails(result.emails);
    } catch (err) {
      console.error("[ColdEmails] Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to generate cold emails. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Copy email to clipboard ─────────────────────────────────────────────────
  const handleCopy = async (email, index, type) => {
    const text =
      type === "subject"
        ? email.subject
        : type === "body"
          ? email.body
          : `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedIdx(`${index}-${type}`);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="cold-email-page">
      {/* Header */}
      <header className="ce-header">
        <button className="ce-header__back" onClick={() => navigate("/dashboard")}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Dashboard
        </button>
        <h1>
          Cold <span className="highlight">Email</span> Generator
        </h1>
        <p>
          Generate high-conversion personalized cold emails for job and
          internship outreach — powered by AI.
        </p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="ce-error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Input Card */}
      {!emails && !loading && (
        <div className="ce-input-card">
          {/* Resume Upload */}
          <div className="ce-field">
            <label className="ce-field__label">
              Resume
              <span className="badge badge--required">Required</span>
            </label>
            {parsedResume ? (
              <div className="ce-resume-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Resume parsed: {parsedResume.skills?.length || 0} skills, {parsedResume.experience?.length || 0} roles — {selectedFileName}
              </div>
            ) : (
              <>
                <label
                  htmlFor="ce-resume-upload"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.8rem 1rem",
                    backgroundColor: "#1e2535",
                    border: "2px dashed #2a3348",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "#7d8590",
                    transition: "border-color 0.2s",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                  {selectedFileName || "Click to upload resume PDF"}
                  <input
                    ref={resumeInputRef}
                    id="ce-resume-upload"
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handleFileUpload}
                  />
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#7d8590", fontSize: "0.75rem", margin: "0.25rem 0" }}>
                  <span style={{ flex: 1, height: "1px", backgroundColor: "#2a3348" }} />
                  OR
                  <span style={{ flex: 1, height: "1px", backgroundColor: "#2a3348" }} />
                </div>
                <textarea
                  className="ce-field__textarea"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={4}
                />
              </>
            )}
          </div>

          {/* Target Role + Company */}
          <div className="ce-field__row">
            <div className="ce-field">
              <label className="ce-field__label">
                Target Role
                <span className="badge badge--required">Required</span>
              </label>
              <input
                className="ce-field__input"
                type="text"
                placeholder="e.g. Frontend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div className="ce-field">
              <label className="ce-field__label">
                Company Name
                <span className="badge badge--optional">Optional</span>
              </label>
              <input
                className="ce-field__input"
                type="text"
                placeholder="e.g. Google, Stripe, Razorpay"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="ce-field">
            <label className="ce-field__label">
              Job Description
              <span className="badge badge--required">Required</span>
            </label>
            <textarea
              className="ce-field__textarea"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ minHeight: "140px" }}
            />
          </div>

          {/* Generate Button */}
          <div className="ce-generate-row">
            <span className="ce-generate-hint">AI-Powered • 15–30s</span>
            <button
              className="ce-generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              
              Generate Cold Emails
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="ce-loading">
          <div className="ce-loading__spinner" />
          <p>Crafting personalized cold emails…</p>
          <p>This usually takes 15–30 seconds.</p>
        </div>
      )}

      {/* Results */}
      {emails && emails.length > 0 && (
        <div className="ce-results">
          <div className="ce-results-header">
            <h2>Your Cold Emails</h2>
            <span className="ce-results-header__count">
              {emails.length} variations generated
            </span>
          </div>

          {emails.map((emailObj, i) => (
            <div key={i} className="email-card">
              <div className="email-card__header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="email-card__number">Email {i + 1}</span>
                  {emailObj.type && (
                    <span className="email-card__tone">
                      {emailObj.type.replace(/-/g, " ")}
                    </span>
                  )}
                </div>
                <div className="email-card__actions">
                  <button
                    className={`email-card__copy-btn ${copiedIdx === `${i}-subject` ? "email-card__copy-btn--copied" : ""}`}
                    onClick={() => handleCopy(emailObj, i, "subject")}
                  >
                    {copiedIdx === `${i}-subject` ? "✓ Copied" : "Copy Subject"}
                  </button>
                  <button
                    className={`email-card__copy-btn ${copiedIdx === `${i}-body` ? "email-card__copy-btn--copied" : ""}`}
                    onClick={() => handleCopy({ ...emailObj, body: emailObj.email }, i, "body")}
                  >
                    {copiedIdx === `${i}-body` ? "✓ Copied" : "Copy Body"}
                  </button>
                  <button
                    className={`email-card__copy-btn ${copiedIdx === `${i}-all` ? "email-card__copy-btn--copied" : ""}`}
                    onClick={() => handleCopy({ ...emailObj, body: emailObj.email }, i, "all")}
                  >
                    {copiedIdx === `${i}-all` ? "✓ Copied" : "Copy All"}
                  </button>
                </div>
              </div>
              <div className="email-card__body">
                <div className="email-card__subject">
                  <strong>Subject:</strong>
                  <span>{emailObj.subject}</span>
                </div>
                <p className="email-card__text">{emailObj.email}</p>
              </div>
            </div>
          ))}

          {/* Regenerate */}
          <div className="ce-regenerate-row">
            <button
              className="ce-regenerate-btn"
              onClick={() => {
                setEmails(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdEmails;
