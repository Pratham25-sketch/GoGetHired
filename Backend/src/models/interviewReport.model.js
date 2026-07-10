const mongoose = require("mongoose");

// ── Technical Question (nested inside a topic group) ─────────────────────────

const technicalQuestionItemSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "real-interview-scenario"],
    },
    question: { type: String, required: true },
    intention: { type: String },
    answer: { type: String },
    followups: [{ type: String }],
  },
  { _id: false },
);

const technicalQuestionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, "Topic is required"],
    },
    questions: [technicalQuestionItemSchema],
  },
  { _id: false },
);

const behavioralQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Behavioral question is required"],
    },
    intention: { type: String },
    answer: { type: String },
    hint: { type: String },
  },
  { _id: false },
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, "Skill is required"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Severity is required"],
    },
  },
  { _id: false },
);

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, "Day is required"],
  },
  focus: {
    type: String,
    required: [true, "Focus is required"],
  },
  tasks: [
    {
      type: String,
      required: [true, "Task is required"],
    },
  ],
});

// ── Step 1: Parsed Resume ─────────────────────────────────────────────────────
// Stores the structured output of POST /api/interview/parse-resume

const parsedResumeSchema = new mongoose.Schema(
  {
    skills: [{ type: String }],
    experience: [
      {
        company: { type: String },
        role: { type: String },
        duration: { type: String },
        description: { type: String },
        _id: false,
      },
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        field: { type: String },
        year: { type: String },
        _id: false,
      },
    ],
    summary: { type: String },
  },
  { _id: false },
);

// ── Step 2: JD Analysis ───────────────────────────────────────────────────────
// Stores the structured output of POST /api/interview/analyze-jd

const jdAnalysisSchema = new mongoose.Schema(
  {
    jobTitle: { type: String },
    experienceLevel: {
      type: String,
      enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
    },
    workMode: {
      type: String,
      enum: ["remote", "hybrid", "onsite", "unspecified"],
    },
    requiredSkills: [
      {
        skill: { type: String },
        priority: { type: String, enum: ["must-have", "nice-to-have"] },
        _id: false,
      },
    ],
    keywords: [{ type: String }],
    responsibilities: [{ type: String }],
    preferredQualifications: [{ type: String }],
  },
  { _id: false },
);

// ── Step 3: Skill Gap Analysis ────────────────────────────────────────────────
// Stores the structured output of POST /api/interview/skill-gap

const skillGapAnalysisSchema = new mongoose.Schema(
  {
    overallMatchPercentage: { type: Number, min: 0, max: 100 },
    summary: { type: String },
    matchedSkills: [
      {
        skill: { type: String },
        candidateSkill: { type: String },
        relevance: { type: String, enum: ["core", "supporting"] },
        _id: false,
      },
    ],
    missingSkills: [
      {
        skill: { type: String },
        priority: { type: String, enum: ["must-have", "nice-to-have"] },
        importance: { type: String },
        howToLearn: { type: String },
        _id: false,
      },
    ],
    strengthAreas: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { _id: false },
);

// ── Step 4: Generated Questions ───────────────────────────────────────────────
// Stores the structured output of POST /api/interview/questions
// Distinct from the bundled questions inside the full AI report —
// these include difficulty, topic/competency, and follow-up questions.

const generatedTechnicalQuestionSchema = new mongoose.Schema(
  {
    question: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    topic: { type: String },
    intention: { type: String },
    answer: { type: String },
    followUpQuestions: [{ type: String }],
  },
  { _id: false },
);

const generatedBehavioralQuestionSchema = new mongoose.Schema(
  {
    question: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    competency: { type: String },
    intention: { type: String },
    answer: { type: String },
    followUpQuestions: [{ type: String }],
  },
  { _id: false },
);

// ── Step 6: ATS Resume Optimisation ──────────────────────────────────────────
// Stores the structured output of POST /api/interview/optimize-resume

const atsScoreBreakdownSchema = new mongoose.Schema(
  {
    keywordMatch: { type: Number, min: 0, max: 100 },
    formatting: { type: Number, min: 0, max: 100 },
    sectionCompleteness: { type: Number, min: 0, max: 100 },
    quantifiedAchievements: { type: Number, min: 0, max: 100 },
    actionVerbs: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const atsOptimizationSchema = new mongoose.Schema(
  {
    scores: {
      original: { type: Number, min: 0, max: 100 },
      optimized: { type: Number, min: 0, max: 100 },
      breakdown: { type: atsScoreBreakdownSchema, default: null },
    },
    optimizedSections: {
      summary: { type: String },
      skills: [{ type: String }],
      experience: [
        {
          company: { type: String },
          role: { type: String },
          duration: { type: String },
          bullets: [{ type: String }],
          _id: false,
        },
      ],
      education: [
        {
          institution: { type: String },
          degree: { type: String },
          field: { type: String },
          year: { type: String },
          _id: false,
        },
      ],
    },
    keywordsInserted: [
      {
        keyword: { type: String },
        section: { type: String },
        reason: { type: String },
        _id: false,
      },
    ],
    improvementsMade: [{ type: String }],
    formattingTips: [{ type: String }],
  },
  { _id: false },
);

const generatedQuestionsSchema = new mongoose.Schema(
  {
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    technicalQuestions: [generatedTechnicalQuestionSchema],
    behavioralQuestions: [generatedBehavioralQuestionSchema],
  },
  { _id: false },
);

// ── Main Interview Report Schema ──────────────────────────────────────────────

const interviewReportSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    user: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    // ── Status ──────────────────────────────────────────────────────────────
    // Tracks how complete the report is:
    //   "draft"    — created (shell), no AI outputs stored yet
    //   "partial"  — at least one step output saved
    //   "complete" — full AI report generated OR all 4 step outputs saved
    status: {
      type: String,
      enum: ["draft", "partial", "complete"],
      default: "draft",
    },

    // ── Source Data ──────────────────────────────────────────────────────────
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resume: {
      type: String, // raw extracted PDF text
    },
    selfDescription: {
      type: String,
    },

    // ── Full AI Report Output (from POST /api/interview/) ────────────────────
    // These are populated when the user generates the full bundled report.
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],

    // ── Granular Step Outputs (Steps 1–4) ────────────────────────────────────
    // Each field is optional and populated individually via
    // PATCH /api/interview/report/:id after calling the respective step endpoint.

    // Step 1 — POST /api/interview/parse-resume
    parsedResume: {
      type: parsedResumeSchema,
      default: null,
    },

    // Step 2 — POST /api/interview/analyze-jd
    jdAnalysis: {
      type: jdAnalysisSchema,
      default: null,
    },

    // Step 3 — POST /api/interview/skill-gap
    skillGapAnalysis: {
      type: skillGapAnalysisSchema,
      default: null,
    },

    // Step 4 — POST /api/interview/questions
    generatedQuestions: {
      type: generatedQuestionsSchema,
      default: null,
    },

    // Step 6 — POST /api/interview/optimize-resume
    atsOptimization: {
      type: atsOptimizationSchema,
      default: null,
    },

    // Step 7 — POST /api/interview/comprehensive-prep
    comprehensivePrep: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Speeds up the "list all my reports" query (user + createdAt DESC)
interviewReportSchema.index({ user: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────
const interviewReportModel = mongoose.model(
  "InterviewReport",
  interviewReportSchema,
);

module.exports = interviewReportModel;
