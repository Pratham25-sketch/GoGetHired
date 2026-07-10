const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route   POST /api/interview/report
 * @desc    Create a lightweight report "shell" with no AI generation.
 *          Provide source data first, then enrich progressively via PATCH.
 *
 *          Body: { jobDescription, title, resumeText?, selfDescription? }
 * @access  Private
 */
interviewRouter.post(
  "/report",
  authMiddleware.authUser,
  interviewController.createReportController,
);

/**
 * @route   PATCH /api/interview/report/:reportId
 * @desc    Enrich an existing report with outputs from Steps 1–4.
 *          Only fields provided in the body are updated.
 *          Status auto-promoted: draft → partial → complete.
 *
 *          Body (any combination):
 *            parsedResume, jdAnalysis, skillGapAnalysis, generatedQuestions, title
 * @access  Private
 */
interviewRouter.patch(
  "/report/:reportId",
  authMiddleware.authUser,
  interviewController.updateReportController,
);

/**
 * @route   DELETE /api/interview/report/:reportId
 * @desc    Permanently delete a report (scoped to logged-in user).
 * @access  Private
 */
interviewRouter.delete(
  "/report/:reportId",
  authMiddleware.authUser,
  interviewController.deleteReportController,
);

/**
 * @route   POST /api/interview/optimize-resume
 * @desc    Analyse a resume against a job description, score it for ATS
 *          compatibility, then return a fully structured optimisation report:
 *          scores (original + optimised + breakdown), rewritten sections,
 *          keywords inserted, improvements made, and formatting tips.
 *
 *          Body:
 *            resumeText:     string  — required (raw text from /parse-resume)
 *            jobDescription: string  — required
 *            parsedResume:   object  — optional: Step 1 output for richer context
 *            jdAnalysis:     object  — optional: Step 2 output for precise keywords
 * @access  Private
 */
interviewRouter.post(
  "/optimize-resume",
  authMiddleware.authUser,
  interviewController.optimizeResumeController,
);

/**
 * @route   POST /api/interview/questions
 * @desc    Generate a tailored set of interview questions (technical + behavioral)
 *          with difficulty levels, topic/competency tags, model answers,
 *          and follow-up questions — based on the candidate's resume and JD.
 *
 *          Body:
 *            resumeText:      string   — required
 *            jobDescription:  string   — required
 *            difficulty:      "easy" | "medium" | "hard" | "mixed"  (default: "mixed")
 *            technicalCount:  number   (default: 8,  min: 1, max: 20)
 *            behavioralCount: number   (default: 5,  min: 1, max: 15)
 * @access  Private
 */
interviewRouter.post(
  "/questions",
  authMiddleware.authUser,
  interviewController.generateInterviewQuestionsController,
);

/**
 * @route   POST /api/interview/skill-gap
 * @desc    Compare resume skills against job requirements and return:
 *          overallMatchPercentage, summary, matchedSkills, missingSkills,
 *          strengthAreas, recommendations.
 *
 *          Mode A (fast — chain from Steps 1 & 2):
 *            { resumeSkills: string[], jdSkills: [{ skill, priority }] }
 *
 *          Mode B (self-contained — AI extracts skills internally):
 *            { resumeText: string, jobDescription: string }
 * @access  Private
 */
interviewRouter.post(
  "/skill-gap",
  authMiddleware.authUser,
  interviewController.detectSkillGapController,
);

/**
 * @route   POST /api/interview/analyze-jd
 * @desc    Analyse a job description and extract jobTitle, experienceLevel,
 *          workMode, requiredSkills (with priority), keywords,
 *          responsibilities, and preferredQualifications.
 *
 *          Accepts EITHER:
 *            - JSON body              { jobDescription: "..." }
 *            - multipart form-data    file field: "jobDescriptionFile" (PDF)
 *          If both are supplied, the uploaded PDF takes precedence.
 * @access  Private
 */
interviewRouter.post(
  "/analyze-jd",
  authMiddleware.authUser,
  upload.single("jobDescriptionFile"), // optional — only runs fileFilter when a file is actually sent
  interviewController.analyzeJobDescriptionController,
);

/**
 * @route   POST /api/interview/parse-resume
 * @desc    Upload a PDF resume and get back structured AI-parsed data:
 *          { skills, experience, education, summary } + raw extracted text.
 *          Use this as a standalone step before generating a full report.
 * @access  Private
 */
interviewRouter.post(
  "/parse-resume",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.parseResumeController,
);

/**
 * @route   POST /api/interview/
 * @desc    Generate a full interview report from resume PDF + job description.
 * @access  Private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.generateInterViewReportController,
);

/**
 * @route   GET /api/interview/report/:interviewId
 * @desc    Fetch a single interview report by ID (scoped to logged-in user).
 * @access  Private
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController,
);

/**
 * @route   GET /api/interview/
 * @desc    Fetch all interview reports for the logged-in user (summary view).
 * @access  Private
 */
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportsController,
);

/**
 * @route   POST /api/interview/resume/pdf/optimized/:reportId
 * @desc    Convert the ATS-optimised resume (Step 6 output) into a downloadable
 *          PDF using a deterministic HTML template — NO additional AI call.
 *
 *          Two modes:
 *            DB mode   — fetches atsOptimization.optimizedSections from the saved report
 *            Body mode — pass optimizedSections directly (before saving to report)
 *
 *          Body (all optional):
 *            optimizedSections: object  — overrides DB value when provided
 *            candidateInfo: {
 *              name, email, phone, linkedin, location
 *            }
 * @access  Private
 */
interviewRouter.post(
  "/resume/pdf/optimized/:reportId",
  authMiddleware.authUser,
  interviewController.generateOptimizedResumePdfController,
);

/**
 * @route   POST /api/interview/resume/pdf/design-preserved/:reportId
 * @desc    Generate an ATS-optimised resume PDF that preserves the EXACT
 *          design and layout of the candidate's original uploaded resume.
 *          Uses AI to replicate the layout + Puppeteer for PDF rendering.
 *
 *          Body (all optional):
 *            optimizedSections: object  — overrides DB value when provided
 *            candidateInfo: { name, email, phone, linkedin, location }
 * @access  Private
 */
interviewRouter.post(
  "/resume/pdf/design-preserved/:reportId",
  authMiddleware.authUser,
  interviewController.generateDesignPreservingResumePdfController,
);

/**
 * @route   POST /api/interview/resume/pdf/:interviewReportId
 * @desc    Generate an ATS-optimised resume PDF from a saved interview report.
 * @access  Private
 */
interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authMiddleware.authUser,
  interviewController.generateResumePdfController,
);

/**
 * @route   POST /api/interview/comprehensive-prep
 * @desc    Generate a comprehensive interview preparation set from resume text
 *          and job description. Returns topic-grouped technical questions
 *          (beginner → advanced + real scenarios), behavioral questions with
 *          hints, and a 4–8 week preparation roadmap.
 *
 *          Body: { resumeText, jobDescription }
 * @access  Private
 */
interviewRouter.post(
  "/comprehensive-prep",
  authMiddleware.authUser,
  interviewController.generateComprehensiveInterviewPrepController,
);

module.exports = interviewRouter;
