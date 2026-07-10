import React, { useState } from "react";
// v1.1 - Force Vite reload to resolve ReferenceError
import ReactMarkdown from "react-markdown";
import "../style/interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useParams } from "react-router";
import { useAuth, useUser } from "@clerk/react";
import { generateColdEmails } from "../../tools/services/tools.api";
import "../../tools/style/cold-emails.scss";


// ── Nav Items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: (
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
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: (
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
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: (
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
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
  },
  {
    id: "ats",
    label: "ATS Optimisation",
    icon: (
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
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "cold-email",
    label: "Generate Cold Emails",
    icon: (
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
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

// ── Difficulty Badge ───────────────────────────────────────────────────────────
const DifficultyBadge = ({ level }) => {
  if (!level) return null;
  return (
    <span className={`difficulty-badge difficulty-badge--${level}`}>
      {level}
    </span>
  );
};

// ── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="q-card">
      <div className="q-card__header" onClick={() => setOpen((o) => !o)}>
        <span className="q-card__index">Q{index + 1}</span>
        <div className="q-card__title-row">
          <p className="q-card__question">{item.question}</p>
          <div className="q-card__meta">
            {item.level && <DifficultyBadge level={item.level} />}
            {item.difficulty && <DifficultyBadge level={item.difficulty} />}
            {item.topic && <span className="q-card__topic">{item.topic}</span>}
            {item.competency && (
              <span className="q-card__topic">{item.competency}</span>
            )}
          </div>
        </div>
        <span
          className={`q-card__chevron ${open ? "q-card__chevron--open" : ""}`}
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
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {open && (
        <div className="q-card__body">
          {item.intention && (
            <div className="q-card__section">
              <span className="q-card__tag q-card__tag--intention">
                Intention
              </span>
              <div className="markdown-content">
                <ReactMarkdown>{item.intention}</ReactMarkdown>
              </div>
            </div>
          )}
          {item.answer && (
            <div className="q-card__section">
              <span className="q-card__tag q-card__tag--answer">
                Model Answer
              </span>
              <div className="markdown-content">
                <ReactMarkdown>{item.answer}</ReactMarkdown>
              </div>
            </div>
          )}
          {item.hint && (
            <div className="q-card__section">
              <span className="q-card__tag q-card__tag--followup">
                💡 Hint
              </span>
              <div className="markdown-content">
                <ReactMarkdown>{item.hint}</ReactMarkdown>
              </div>
            </div>
          )}
          {/* Support both followups (new) and followUpQuestions (old) */}
          {((item.followups && item.followups.length > 0) ||
            (item.followUpQuestions && item.followUpQuestions.length > 0)) && (
            <div className="q-card__section">
              <span className="q-card__tag q-card__tag--followup">
                Follow-up Questions
              </span>
              <ul className="q-card__followups">
                {(item.followups || item.followUpQuestions).map((fq, i) => (
                  <li key={i}>{fq}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Road Map Day ──────────────────────────────────────────────────────────────
const RoadMapDay = ({ day }) => (
  <div className="roadmap-day">
    <div className="roadmap-day__header">
      <span className="roadmap-day__badge">Day {day.day}</span>
      <h3 className="roadmap-day__focus">{day.focus}</h3>
    </div>
    <ul className="roadmap-day__tasks">
      {day.tasks.map((task, i) => (
        <li key={i}>
          <span className="roadmap-day__bullet" />
          {task}
        </li>
      ))}
    </ul>
  </div>
);

// ── ATS Score Ring ────────────────────────────────────────────────────────────
const ScoreRing = ({ score, label, size = 80 }) => {
  const color = score >= 75 ? "#3fb950" : score >= 50 ? "#f5a623" : "#ff4d4d";
  return (
    <div
      className="ats-score-ring"
      style={{ width: size, height: size, borderColor: color }}
    >
      <span className="ats-score-ring__value">{score}</span>
      <span className="ats-score-ring__label">{label}</span>
    </div>
  );
};

// ── ATS Section ───────────────────────────────────────────────────────────────
const ATSSection = ({
  report,
  atsOptimization,
  atsLoading,
  optimizeForATS,
  downloadOptimizedResumePdf,
  downloadDesignPreservedResumePdf,
}) => {
  if (atsLoading) {
    return (
      <div className="ats-loading">
        <div className="ats-loading__spinner" />
        <p>Analysing your resume against the job description…</p>
        <p className="ats-loading__sub">This usually takes 15–30 seconds.</p>
      </div>
    );
  }

  if (!atsOptimization) {
    const hasResume = !!(report?.resume || report?.selfDescription);
    return (
      <div className="ats-empty">
        <div className="ats-empty__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h3>ATS Resume Optimisation</h3>
        <p>
          Let AI score your resume against this job description, rewrite each
          section with targeted keywords, and generate a download-ready
          ATS-friendly PDF.
        </p>
        {!hasResume && (
          <p className="ats-empty__warn">
            ⚠ No resume text found in this report. ATS optimisation works best
            when you uploaded a PDF resume while generating this plan.
          </p>
        )}
        <button
          className="ats-optimize-btn"
          onClick={optimizeForATS}
          disabled={!hasResume}
          style={{
            opacity: hasResume ? 1 : 0.5,
            cursor: hasResume ? "pointer" : "not-allowed",
          }}
        >
         
          Optimise My Resume for ATS
        </button>
      </div>
    );
  }

  // Results view
  const {
    scores,
    optimizedSections,
    keywordsInserted = [],
    improvementsMade = [],
    formattingTips = [],
  } = atsOptimization;
  const improvement = (scores?.optimized ?? 0) - (scores?.original ?? 0);

  return (
    <div className="ats-results">
      {/* Score Overview */}
      <div className="content-header">
        <h2>ATS Optimisation Report</h2>
        <span className="content-header__count">
          +{improvement} point improvement
        </span>
      </div>

      <div className="ats-scores-row">
        <div className="ats-score-card">
          <p className="ats-score-card__label">Original Score</p>
          <ScoreRing score={scores?.original ?? 0} label="Before" />
        </div>
        <div className="ats-score-arrow">→</div>
        <div className="ats-score-card">
          <p className="ats-score-card__label">Optimised Score</p>
          <ScoreRing score={scores?.optimized ?? 0} label="After" size={96} />
        </div>
      </div>

      {/* Score Breakdown */}
      {scores?.breakdown && (
        <div className="ats-breakdown">
          <p className="ats-breakdown__title">Score Breakdown</p>
          <div className="ats-breakdown__grid">
            {Object.entries(scores.breakdown).map(([key, val]) => (
              <div key={key} className="ats-breakdown__item">
                <div className="ats-breakdown__bar-wrap">
                  <div
                    className="ats-breakdown__bar"
                    style={{
                      width: `${val}%`,
                      backgroundColor:
                        val >= 75
                          ? "#3fb950"
                          : val >= 50
                            ? "#f5a623"
                            : "#ff4d4d",
                    }}
                  />
                </div>
                <div className="ats-breakdown__meta">
                  <span className="ats-breakdown__key">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="ats-breakdown__val">{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords Inserted */}
      {keywordsInserted.length > 0 && (
        <div className="ats-block">
          <p className="ats-block__title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Keywords Inserted ({keywordsInserted.length})
          </p>
          <div className="ats-keywords">
            {keywordsInserted.map((k, i) => (
              <div key={i} className="ats-keyword-item">
                <span className="ats-keyword-item__tag">{k.keyword}</span>
                <span className="ats-keyword-item__section">→ {k.section}</span>
                <span className="ats-keyword-item__reason">{k.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements Made */}
      {improvementsMade.length > 0 && (
        <div className="ats-block">
          <p className="ats-block__title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Improvements Made ({improvementsMade.length})
          </p>
          <ul className="ats-list">
            {improvementsMade.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formatting Tips */}
      {formattingTips.length > 0 && (
        <div className="ats-block">
          <p className="ats-block__title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Formatting Tips
          </p>
          <ul className="ats-list ats-list--tips">
            {formattingTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Optimised Sections Preview */}
      {optimizedSections && (
        <div className="ats-block">
          <p className="ats-block__title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Optimised Summary Preview
          </p>
          {optimizedSections.summary && (
            <p className="ats-summary-preview">{optimizedSections.summary}</p>
          )}
          {optimizedSections.skills?.length > 0 && (
            <div className="ats-skills-preview">
              {optimizedSections.skills.slice(0, 12).map((s, i) => (
                <span key={i} className="ats-skill-tag">
                  {s}
                </span>
              ))}
              {optimizedSections.skills.length > 12 && (
                <span className="ats-skill-tag ats-skill-tag--more">
                  +{optimizedSections.skills.length - 12} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Download PDFs */}
      <div className="ats-download-row">
       
        <button
          className="ats-download-btn"
          onClick={downloadDesignPreservedResumePdf}
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
        <button className="ats-rerun-btn" onClick={optimizeForATS}>
          Re-run Optimisation
        </button>
      </div>
    </div>
  );
};

// ── Cold Email Section ────────────────────────────────────────────────────────
const ColdEmailSection = ({ report }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [emails, setEmails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [targetRole, setTargetRole] = useState(report?.title || "");
  const [companyName, setCompanyName] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setEmails(null);
    try {
      const token = await getToken();
      
      let resumeData = report?.parsedResume ? { ...report.parsedResume } : null;
      if (!resumeData && report?.resume) {
        resumeData = { summary: report.resume.trim(), skills: [], experience: [], education: [] };
      }
      if (!resumeData && report?.selfDescription) {
        resumeData = { summary: report.selfDescription.trim(), skills: [], experience: [], education: [] };
      }
      if (!resumeData) {
        throw new Error("No resume or background text found in this report.");
      }

      resumeData.personalInfo = {
        name: user?.fullName || "[Your Name]",
        email: user?.primaryEmailAddress?.emailAddress || "[Your Email]",
      };

      const result = await generateColdEmails({
        resumeData,
        jobDescription: report?.jobDescription || "",
        targetRole: targetRole.trim() || report?.title || "the position",
        companyName: companyName.trim() || null,
        token,
      });
      setEmails(result.emails);
    } catch (err) {
      console.error("[ColdEmailSection] Error:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to generate cold emails."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (emailObj, index, type) => {
    const text =
      type === "subject"
        ? emailObj.subject
        : type === "body"
          ? emailObj.email
          : `Subject: ${emailObj.subject}\n\n${emailObj.email}`;
    await navigator.clipboard.writeText(text);
    setCopiedIdx(`${index}-${type}`);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="cold-email-page" style={{ padding: 0, minHeight: 'auto' }}>
       <div className="content-header" style={{ marginBottom: "1.5rem" }}>
         <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Cold Email Generator</h2>
       </div>

      {error && (
        <div className="ce-error-banner" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {!emails && !loading && (
        <div className="ce-input-card">
           <div style={{ marginBottom: '1.5rem' }}>
             <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#7d8590', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>READY TO OUTREACH? WE WILL USE THE RESUME AND JOB DESCRIPTION YOU PROVIDED.</strong>
             <span style={{ color: '#7d8590', fontSize: '0.9rem' }}>You can adjust the target role and company name below.</span>
           </div>

           {/* Target Role + Company */}
           <div className="ce-field__row">
             <div className="ce-field">
               <label className="ce-field__label">
                 Target Role
                 <span className="badge badge--optional">Optional</span>
               </label>
               <input
                 className="ce-field__input"
                 type="text"
                 value={targetRole}
                 onChange={(e) => setTargetRole(e.target.value)}
                 placeholder={report?.title || "e.g. Frontend Engineer"}
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
                 value={companyName}
                 onChange={(e) => setCompanyName(e.target.value)}
                 placeholder="e.g. Google, Stripe"
               />
             </div>
           </div>

           {/* Generate Button */}
           <div className="ce-generate-row">
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

      {loading && (
        <div className="ce-loading">
          <div className="ce-loading__spinner" />
          <p>Crafting personalized cold emails…</p>
          <p>This usually takes 15–30 seconds.</p>
        </div>
      )}

      {emails && emails.length > 0 && (
         <div className="ce-results">
           <div className="ce-results-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7d8590', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff2d55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
               {emails.length} variations generated
             </div>
           </div>

           {emails.map((emailObj, i) => (
            <div key={i} className="email-card">
              <div className="email-card__header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="email-card__number" style={{ color: '#ff2d55', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>Email {i + 1}</span>
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
                    Copy Subject
                  </button>
                  <button
                    className={`email-card__copy-btn ${copiedIdx === `${i}-body` ? "email-card__copy-btn--copied" : ""}`}
                    onClick={() => handleCopy({ ...emailObj, body: emailObj.email }, i, "body")}
                  >
                    Copy Body
                  </button>
                  <button
                    className={`email-card__copy-btn ${copiedIdx === `${i}-all` ? "email-card__copy-btn--copied" : ""}`}
                    onClick={() => handleCopy({ ...emailObj, body: emailObj.email }, i, "all")}
                  >
                    Copy All
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

          <div className="ce-regenerate-row">
            <button
              className="ce-regenerate-btn"
              onClick={() => setEmails(null)}
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

import DashboardNavbar from "../../../components/DashboardNavbar.jsx";

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const {
    report,
    loading,
    error,
    setError,
    getResumePdf,
    atsOptimization,
    atsLoading,
    optimizeForATS,
    downloadOptimizedResumePdf,
    downloadDesignPreservedResumePdf,
  } = useInterview();
  const { interviewId } = useParams();

  // NOTE: getReportById is handled by the useInterview hook's own useEffect.
  // We intentionally do NOT duplicate it here — that would cause a double-fetch.

  if (loading) {
    return (
      <main className="loading-screen">
        <h1>Loading your interview plan…</h1>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="loading-screen">
        <h1>Report not found.</h1>
      </main>
    );
  }

  const scoreColor =
    report.matchScore >= 80
      ? "score--high"
      : report.matchScore >= 60
        ? "score--mid"
        : "score--low";

  return (
    <div className="interview-page">
      <DashboardNavbar />
      <div className="interview-layout">
        {/* ── Left Nav ── */}
        <nav className="interview-nav">
          <div className="nav-content">
            <p className="interview-nav__label">Sections</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? "interview-nav__item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="interview-nav__icon">{item.icon}</span>
                {item.label}
                {item.id === "ats" && atsOptimization && (
                  <span className="interview-nav__badge">✓</span>
                )}
              </button>
            ))}
          </div>

        
        </nav>

        <div className="interview-divider" />

        {/* ── Center Content ── */}
        <main className="interview-content">
          {/* Error Banner */}
          {error && (
            <div className="interview-error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss">
                ✕
              </button>
            </div>
          )}

          {activeNav === "technical" && (
            <section>
              <div className="content-header">
                <h2>Technical Questions</h2>
                <span className="content-header__count">
                  {report.technicalQuestions.reduce(
                    (sum, t) => sum + (t.questions?.length || 0),
                    0,
                  )}{" "}
                  questions across {report.technicalQuestions.length} topics
                </span>
              </div>
              {report.technicalQuestions.map((topicGroup, ti) => (
                <div key={ti} className="topic-group">
                  <h3 className="topic-group__title">{topicGroup.topic}</h3>
                  <span className="topic-group__count">
                    {topicGroup.questions?.length || 0} questions
                  </span>
                  <div className="q-list">
                    {(topicGroup.questions || []).map((q, qi) => (
                      <QuestionCard key={qi} item={q} index={qi} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeNav === "behavioral" && (
            <section>
              <div className="content-header">
                <h2>Behavioral Questions</h2>
                <span className="content-header__count">
                  {report.behavioralQuestions.length} questions
                </span>
              </div>
              <div className="q-list">
                {report.behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="content-header">
                <h2>Preparation Road Map</h2>
                <span className="content-header__count">
                  {report.preparationPlan.length}-day plan
                </span>
              </div>
              <div className="roadmap-list">
                {report.preparationPlan.map((day) => (
                  <RoadMapDay key={day.day} day={day} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "ats" && (
            <ATSSection
              report={report}
              atsOptimization={atsOptimization}
              atsLoading={atsLoading}
              optimizeForATS={optimizeForATS}
              downloadOptimizedResumePdf={downloadOptimizedResumePdf}
              downloadDesignPreservedResumePdf={downloadDesignPreservedResumePdf}
            />
          )}

          {activeNav === "cold-email" && (
            <ColdEmailSection report={report} />
          )}
        </main>

        <div className="interview-divider" />

        {/* ── Right Sidebar ── */}
        <aside className="interview-sidebar">
          {/* Match Score */}
          <div className="match-score">
            <p className="match-score__label">Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className="match-score__value">{report.matchScore}</span>
              <span className="match-score__pct">%</span>
            </div>
            <p className="match-score__sub">
              {report.matchScore >= 80
                ? "Strong match for this role"
                : report.matchScore >= 60
                  ? "Good match — close the gaps"
                  : "Needs work — see ATS tab"}
            </p>
          </div>

          <div className="sidebar-divider" />

          {/* Skill Gaps */}
          <div className="skill-gaps">
            <p className="skill-gaps__label">Skill Gaps</p>
            {report.skillGaps.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#7d8590" }}>
                No skill gaps detected 🎉
              </p>
            ) : (
              <div className="skill-gaps__list">
                {report.skillGaps.map((gap, i) => (
                  <span
                    key={i}
                    className={`skill-tag skill-tag--${gap.severity}`}
                  >
                    {gap.skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ATS Score (if optimised) */}
          {atsOptimization?.scores && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-ats">
                <p className="skill-gaps__label">ATS Score</p>
                <div className="sidebar-ats__row">
                  <div className="sidebar-ats__pill sidebar-ats__pill--before">
                    {atsOptimization.scores.original}
                    <span>before</span>
                  </div>
                  <span className="sidebar-ats__arrow">→</span>
                  <div className="sidebar-ats__pill sidebar-ats__pill--after">
                    {atsOptimization.scores.optimized}
                    <span>after</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Interview;
