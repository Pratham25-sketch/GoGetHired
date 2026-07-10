const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
  parseResume,
  analyzeJobDescription,
  detectSkillGap,
  generateInterviewQuestions,
  optimizeResumeForATS,
  generatePdfFromOptimizedResume,
  generateComprehensiveInterviewPrep,
  generateDesignPreservingResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @route   POST /api/interview/parse-resume
 * @desc    Upload a PDF resume, extract text, and return structured
 *          AI-parsed data: skills, experience, education, summary.
 * @access  Private
 */
async function parseResumeController(req, res) {
  try {
    // multer fileFilter already rejects non-PDFs, but double-check
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "A PDF resume file is required." });
    }

    // ── Step 1: Extract raw text from PDF ──────────────────────────────────
    const pdfData = await new pdfParse.PDFParse(
      Uint8Array.from(req.file.buffer),
    ).getText();
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(422).json({
        message:
          "Could not extract readable text from the uploaded PDF. " +
          "Please ensure the file is a text-based PDF (not a scanned image).",
      });
    }

    // ── Step 2: Send extracted text to Gemini for structured parsing ────────
    const parsedResume = await parseResume(resumeText);

    return res.status(200).json({
      message: "Resume parsed successfully.",
      resumeText, // raw extracted text (useful for downstream steps)
      parsedResume, // { skills, experience, education, summary }
    });
  } catch (error) {
    console.error("[parseResumeController]", error.message);
    return res.status(500).json({
      message: "Failed to parse resume.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/
 * @desc    Generate a full interview report from resume PDF + job description.
 * @access  Private
 */
async function generateInterViewReportController(req, res) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "A PDF resume file is required." });
    }

    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: "Job description is required." });
    }

    // Extract text from uploaded PDF
    const pdfData = await new pdfParse.PDFParse(
      Uint8Array.from(req.file.buffer),
    ).getText();
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(422).json({
        message:
          "Could not extract readable text from the uploaded PDF. " +
          "Please ensure the file is a text-based PDF (not a scanned image).",
      });
    }

    // Generate interview report via Gemini
    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    // Persist to MongoDB
    const interviewReport = await interviewReportModel.create({
      user: req.auth.userId,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interViewReportByAi,
    });

    return res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("[generateInterViewReportController]", error.message);
    return res.status(500).json({
      message: "Failed to generate interview report.",
      error: error.message,
    });
  }
}

/**
 * @route   GET /api/interview/report/:interviewId
 * @desc    Fetch a single interview report by ID (scoped to logged-in user).
 * @access  Private
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.auth.userId,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("[getInterviewReportByIdController]", error.message);
    return res.status(500).json({
      message: "Failed to fetch interview report.",
      error: error.message,
    });
  }
}

/**
 * @route   GET /api/interview/
 * @desc    Fetch all interview reports for the logged-in user (summary view).
 * @access  Private
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.auth.userId })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v " +
          "-technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      );

    return res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (error) {
    console.error("[getAllInterviewReportsController]", error.message);
    return res.status(500).json({
      message: "Failed to fetch interview reports.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/resume/pdf/:interviewReportId
 * @desc    Generate an ATS-optimised resume PDF from a saved interview report.
 * @access  Private
 */
async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.auth.userId,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[generateResumePdfController]", error.message);
    return res.status(500).json({
      message: "Failed to generate resume PDF.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/analyze-jd
 * @desc    Analyse a job description and extract:
 *          jobTitle, experienceLevel, workMode, requiredSkills (with priority),
 *          keywords, responsibilities, preferredQualifications.
 *
 *          Accepts EITHER:
 *            - JSON body  { jobDescription: "..." }
 *            - multipart form-data with a PDF file field named "jobDescriptionFile"
 *          If both are supplied the uploaded PDF takes precedence.
 * @access  Private
 */
async function analyzeJobDescriptionController(req, res) {
  try {
    let jdText = "";

    // ── Priority 1: PDF file upload ─────────────────────────────────────────
    if (req.file) {
      const pdfData = await new pdfParse.PDFParse(
        Uint8Array.from(req.file.buffer),
      ).getText();
      jdText = pdfData.text;

      if (!jdText || jdText.trim().length < 20) {
        return res.status(422).json({
          message:
            "Could not extract readable text from the uploaded PDF. " +
            "Please use a text-based PDF or paste the job description as text.",
        });
      }
    }
    // ── Priority 2: Plain text in request body ──────────────────────────────
    else if (
      req.body.jobDescription &&
      req.body.jobDescription.trim().length > 0
    ) {
      jdText = req.body.jobDescription.trim();
    }
    // ── Neither provided ────────────────────────────────────────────────────
    else {
      return res.status(400).json({
        message:
          "Job description is required. " +
          "Provide it as plain text in the 'jobDescription' field " +
          "or upload a PDF file in the 'jobDescriptionFile' field.",
      });
    }

    if (jdText.length < 20) {
      return res.status(400).json({
        message:
          "Job description is too short to analyse. Please provide more detail.",
      });
    }

    // ── Send to Gemini for structured analysis ──────────────────────────────
    const analysis = await analyzeJobDescription(jdText);

    return res.status(200).json({
      message: "Job description analysed successfully.",
      jdText, // raw text — available for downstream steps (skill gap, etc.)
      analysis, // { jobTitle, experienceLevel, workMode, requiredSkills,
      //   keywords, responsibilities, preferredQualifications }
    });
  } catch (error) {
    console.error("[analyzeJobDescriptionController]", error.message);
    return res.status(500).json({
      message: "Failed to analyse job description.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/skill-gap
 * @desc    Compare resume skills against job requirements and return:
 *          overallMatchPercentage, summary, matchedSkills, missingSkills,
 *          strengthAreas, recommendations.
 *
 *          TWO input modes — send exactly one:
 *
 *          Mode A — Pre-extracted arrays (fast, chains from Steps 1 & 2):
 *          {
 *            "resumeSkills": ["React", "Node.js", ...],
 *            "jdSkills": [{ "skill": "React", "priority": "must-have" }, ...]
 *          }
 *
 *          Mode B — Raw text (self-contained, AI extracts skills internally):
 *          {
 *            "resumeText": "John Doe, Software Engineer...",
 *            "jobDescription": "We are looking for a Senior..."
 *          }
 * @access  Private
 */
async function detectSkillGapController(req, res) {
  try {
    let resumeSkills = [];
    let jdSkills = [];

    const {
      resumeSkills: rsInput,
      jdSkills: jdInput,
      resumeText,
      jobDescription,
    } = req.body;

    // ── Mode A: pre-extracted arrays (output from Steps 1 & 2) ─────────────
    if (rsInput !== undefined || jdInput !== undefined) {
      if (!Array.isArray(rsInput) || rsInput.length === 0) {
        return res.status(400).json({
          message:
            "'resumeSkills' must be a non-empty array of skill strings. " +
            "Obtain it from POST /api/interview/parse-resume → parsedResume.skills",
        });
      }

      if (!Array.isArray(jdInput) || jdInput.length === 0) {
        return res.status(400).json({
          message:
            "'jdSkills' must be a non-empty array of { skill, priority } objects. " +
            "Obtain it from POST /api/interview/analyze-jd → analysis.requiredSkills",
        });
      }

      resumeSkills = rsInput;
      jdSkills = jdInput;
    }
    // ── Mode B: raw text — AI extracts skills internally then compares ──────
    else if (resumeText || jobDescription) {
      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({
          message:
            "'resumeText' is required in Mode B and must be at least 50 characters.",
        });
      }

      if (!jobDescription || jobDescription.trim().length < 20) {
        return res.status(400).json({
          message:
            "'jobDescription' is required in Mode B and must be at least 20 characters.",
        });
      }

      // Extract skills from both texts in parallel for speed
      const [parsedResume, jdAnalysis] = await Promise.all([
        parseResume(resumeText.trim()),
        analyzeJobDescription(jobDescription.trim()),
      ]);

      resumeSkills = parsedResume.skills;
      jdSkills = jdAnalysis.requiredSkills;

      if (resumeSkills.length === 0) {
        return res.status(422).json({
          message:
            "Could not extract any skills from the provided resume text. " +
            "Please provide a more detailed resume.",
        });
      }

      if (jdSkills.length === 0) {
        return res.status(422).json({
          message:
            "Could not extract any required skills from the job description. " +
            "Please provide a more detailed job description.",
        });
      }
    }
    // ── Neither mode provided ────────────────────────────────────────────────
    else {
      return res.status(400).json({
        message:
          "Provide one of the following input modes:\n" +
          "  Mode A (fast):          { resumeSkills: string[], jdSkills: [{ skill, priority }] }\n" +
          "  Mode B (self-contained): { resumeText: string, jobDescription: string }",
      });
    }

    // ── Run skill gap analysis with Gemini ───────────────────────────────────
    const skillGap = await detectSkillGap({ resumeSkills, jdSkills });

    return res.status(200).json({
      message: "Skill gap analysis complete.",
      input: {
        totalResumeSkills: resumeSkills.length,
        totalJdSkills: jdSkills.length,
      },
      skillGap,
      // skillGap shape:
      // {
      //   overallMatchPercentage: number,
      //   summary:                string,
      //   matchedSkills:          [{ skill, candidateSkill, relevance }],
      //   missingSkills:          [{ skill, priority, importance, howToLearn }],
      //   strengthAreas:          string[],
      //   recommendations:        string[]
      // }
    });
  } catch (error) {
    console.error("[detectSkillGapController]", error.message);
    return res.status(500).json({
      message: "Failed to complete skill gap analysis.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/questions
 * @desc    Generate a tailored set of interview questions (technical + behavioral)
 *          with difficulty levels, topic/competency tags, model answers,
 *          and follow-up questions — based on the candidate's resume and JD.
 *
 *          Body:
 *          {
 *            "resumeText":      string,   — required (raw text from parse-resume)
 *            "jobDescription":  string,   — required
 *            "difficulty":      "easy" | "medium" | "hard" | "mixed",  — optional (default: "mixed")
 *            "technicalCount":  number,   — optional (default: 8,  min: 1, max: 20)
 *            "behavioralCount": number    — optional (default: 5,  min: 1, max: 15)
 *          }
 * @access  Private
 */
async function generateInterviewQuestionsController(req, res) {
  try {
    const {
      resumeText,
      jobDescription,
      difficulty = "mixed",
      technicalCount = 8,
      behavioralCount = 5,
    } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message:
          "'resumeText' is required and must be at least 50 characters. " +
          "Use POST /api/interview/parse-resume to extract text from a PDF.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message:
          "'jobDescription' is required and must be at least 20 characters.",
      });
    }

    const validDifficulties = ["easy", "medium", "hard", "mixed"];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        message: `'difficulty' must be one of: ${validDifficulties.join(", ")}.`,
      });
    }

    const parsedTechnicalCount = parseInt(technicalCount, 10);
    const parsedBehavioralCount = parseInt(behavioralCount, 10);

    if (
      isNaN(parsedTechnicalCount) ||
      parsedTechnicalCount < 1 ||
      parsedTechnicalCount > 20
    ) {
      return res.status(400).json({
        message: "'technicalCount' must be a number between 1 and 20.",
      });
    }

    if (
      isNaN(parsedBehavioralCount) ||
      parsedBehavioralCount < 1 ||
      parsedBehavioralCount > 15
    ) {
      return res.status(400).json({
        message: "'behavioralCount' must be a number between 1 and 15.",
      });
    }

    // ── Generate questions via Gemini ───────────────────────────────────────
    const questions = await generateInterviewQuestions({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      difficulty,
      technicalCount: parsedTechnicalCount,
      behavioralCount: parsedBehavioralCount,
    });

    return res.status(200).json({
      message: "Interview questions generated successfully.",
      meta: {
        difficulty,
        technicalCount: questions.technicalQuestions.length,
        behavioralCount: questions.behavioralQuestions.length,
      },
      questions,
      // questions shape:
      // {
      //   technicalQuestions: [{
      //     question, difficulty, topic, intention, answer, followUpQuestions[]
      //   }],
      //   behavioralQuestions: [{
      //     question, difficulty, competency, intention, answer, followUpQuestions[]
      //   }]
      // }
    });
  } catch (error) {
    console.error("[generateInterviewQuestionsController]", error.message);
    return res.status(500).json({
      message: "Failed to generate interview questions.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/report
 * @desc    Create a lightweight report "shell" — no AI generation.
 *          Use this to save source data first, then enrich progressively
 *          via PATCH /api/interview/report/:id with Step 1–4 outputs.
 *
 *          Body:
 *          {
 *            "jobDescription": string,  — required
 *            "title":          string,  — required
 *            "resumeText":     string,  — optional (raw text from parse-resume)
 *            "selfDescription": string  — optional
 *          }
 * @access  Private
 */
async function createReportController(req, res) {
  try {
    const { jobDescription, title, resumeText, selfDescription } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({
        message: "'jobDescription' is required.",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        message:
          "'title' is required. Provide a short label for this report (e.g. the job title).",
      });
    }

    const report = await interviewReportModel.create({
      user: req.auth.userId,
      jobDescription: jobDescription.trim(),
      title: title.trim(),
      resume: resumeText ? resumeText.trim() : undefined,
      selfDescription: selfDescription ? selfDescription.trim() : undefined,
      status: "draft",
    });

    return res.status(201).json({
      message:
        "Report created successfully. Enrich it by calling the step endpoints and PATCHing the results.",
      report,
    });
  } catch (error) {
    console.error("[createReportController]", error.message);
    return res.status(500).json({
      message: "Failed to create report.",
      error: error.message,
    });
  }
}

/**
 * @route   PATCH /api/interview/report/:reportId
 * @desc    Enrich an existing report with outputs from Steps 1–4.
 *          Only the fields you send will be updated — all others stay unchanged.
 *
 *          Accepted fields (send any combination):
 *          {
 *            "parsedResume":      object,  — output of POST /api/interview/parse-resume  → parsedResume
 *            "jdAnalysis":        object,  — output of POST /api/interview/analyze-jd    → analysis
 *            "skillGapAnalysis":  object,  — output of POST /api/interview/skill-gap     → skillGap
 *            "generatedQuestions":object,  — output of POST /api/interview/questions     → questions
 *            "atsOptimization":   object,  — output of POST /api/interview/optimize-resume → optimization
 *            "title":             string   — rename the report
 *          }
 *
 *          Status is auto-promoted:
 *            draft → partial   (on first successful update)
 *            partial → complete (when all 4 step outputs are present)
 *            "atsOptimization" field accepted from Step 6 output
 * @access  Private
 */
async function updateReportController(req, res) {
  try {
    const { reportId } = req.params;
    const {
      parsedResume,
      jdAnalysis,
      skillGapAnalysis,
      generatedQuestions,
      atsOptimization,
      comprehensivePrep,
      title,
    } = req.body;

    // ── Build the $set payload from provided fields only ────────────────────
    const updates = {};

    if (parsedResume !== undefined) updates.parsedResume = parsedResume;
    if (jdAnalysis !== undefined) updates.jdAnalysis = jdAnalysis;
    if (skillGapAnalysis !== undefined)
      updates.skillGapAnalysis = skillGapAnalysis;
    if (generatedQuestions !== undefined)
      updates.generatedQuestions = generatedQuestions;
    if (atsOptimization !== undefined)
      updates.atsOptimization = atsOptimization;
    if (comprehensivePrep !== undefined)
      updates.comprehensivePrep = comprehensivePrep;
    if (title !== undefined && title.trim().length > 0)
      updates.title = title.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message:
          "Nothing to update. Provide at least one of: " +
          "parsedResume, jdAnalysis, skillGapAnalysis, generatedQuestions, atsOptimization, comprehensivePrep, title.",
      });
    }

    // ── Fetch the current report to compute the new status ──────────────────
    const existing = await interviewReportModel.findOne({
      _id: reportId,
      user: req.auth.userId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Report not found." });
    }

    // Merge what is already stored with what is being added now
    const mergedParsedResume = updates.parsedResume ?? existing.parsedResume;
    const mergedJdAnalysis = updates.jdAnalysis ?? existing.jdAnalysis;
    const mergedSkillGapAnalysis =
      updates.skillGapAnalysis ?? existing.skillGapAnalysis;
    const mergedGeneratedQuestions =
      updates.generatedQuestions ?? existing.generatedQuestions;

    const mergedAtsOptimization =
      updates.atsOptimization ?? existing.atsOptimization;

    const allFourPresent =
      mergedParsedResume != null &&
      mergedJdAnalysis != null &&
      mergedSkillGapAnalysis != null &&
      mergedGeneratedQuestions != null;

    // Also "complete" if the full AI report was already generated
    const fullReportPresent =
      existing.matchScore != null && existing.technicalQuestions.length > 0;

    if (allFourPresent || fullReportPresent) {
      updates.status = "complete";
    } else {
      updates.status = "partial";
    }

    // ── Apply the update ─────────────────────────────────────────────────────
    const report = await interviewReportModel.findOneAndUpdate(
      { _id: reportId, user: req.auth.userId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Report updated successfully.",
      report,
    });
  } catch (error) {
    console.error("[updateReportController]", error.message);
    return res.status(500).json({
      message: "Failed to update report.",
      error: error.message,
    });
  }
}

/**
 * @route   DELETE /api/interview/report/:reportId
 * @desc    Permanently delete a report.
 *          Scoped to the logged-in user — cannot delete another user's report.
 * @access  Private
 */
async function deleteReportController(req, res) {
  try {
    const { reportId } = req.params;

    const deleted = await interviewReportModel.findOneAndDelete({
      _id: reportId,
      user: req.auth.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Report not found." });
    }

    return res.status(200).json({
      message: "Report deleted successfully.",
      deletedReportId: reportId,
    });
  } catch (error) {
    console.error("[deleteReportController]", error.message);
    return res.status(500).json({
      message: "Failed to delete report.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/optimize-resume
 * @desc    Analyse a resume against a job description, score it for ATS
 *          compatibility, then return a fully structured optimisation report:
 *          scores (original + optimised + breakdown), rewritten sections,
 *          keywords inserted, improvements made, and formatting tips.
 *
 *          Body:
 *          {
 *            "resumeText":     string,  — required (raw text from /parse-resume)
 *            "jobDescription": string,  — required
 *            "parsedResume":   object,  — optional: Step 1 output for richer context
 *            "jdAnalysis":     object   — optional: Step 2 output for precise keywords
 *          }
 * @access  Private
 */
async function optimizeResumeController(req, res) {
  try {
    const { resumeText, jobDescription, parsedResume, jdAnalysis } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message:
          "'resumeText' is required and must be at least 50 characters. " +
          "Use POST /api/interview/parse-resume to extract text from a PDF.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message:
          "'jobDescription' is required and must be at least 20 characters.",
      });
    }

    // ── Run ATS optimisation via Gemini ─────────────────────────────────────
    const optimization = await optimizeResumeForATS({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      parsedResume: parsedResume || null, // Step 1 output — used for precise skill preservation
      jdAnalysis: jdAnalysis || null, // Step 2 output — used for precise keyword injection
    });

    return res.status(200).json({
      message: "ATS resume optimisation complete.",
      scores: {
        original: optimization.scores.original,
        optimized: optimization.scores.optimized,
        improvement:
          optimization.scores.optimized - optimization.scores.original,
      },
      optimization,
      // optimization shape:
      // {
      //   scores: {
      //     original:  number,
      //     optimized: number,
      //     breakdown: { keywordMatch, formatting, sectionCompleteness,
      //                  quantifiedAchievements, actionVerbs }
      //   },
      //   optimizedSections: {
      //     summary:    string,
      //     skills:     string[],
      //     experience: [{ company, role, duration, bullets[] }],
      //     education:  [{ institution, degree, field, year }]
      //   },
      //   keywordsInserted:  [{ keyword, section, reason }],
      //   improvementsMade:  string[],
      //   formattingTips:    string[]
      // }
    });
  } catch (error) {
    console.error("[optimizeResumeController]", error.message);
    return res.status(500).json({
      message: "Failed to optimise resume.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/resume/pdf/optimized/:reportId
 * @desc    Convert the ATS-optimised resume (Step 6 output) into a downloadable
 *          PDF using a deterministic HTML template — NO additional AI call.
 *
 *          Two modes:
 *            1. DB mode   — fetches atsOptimization.optimizedSections from the saved report
 *            2. Body mode — accepts optimizedSections directly in the body
 *               (use this before saving the optimization to the report)
 *
 *          Body (all optional):
 *          {
 *            "optimizedSections": object,  — overrides DB value when provided
 *            "candidateInfo": {
 *              "name":     string,
 *              "email":    string,
 *              "phone":    string,
 *              "linkedin": string,
 *              "location": string
 *            }
 *          }
 * @access  Private
 */
async function generateOptimizedResumePdfController(req, res) {
  try {
    const { reportId } = req.params;
    const { optimizedSections: bodyOptimizedSections, candidateInfo = {} } =
      req.body;

    let optimizedSections = bodyOptimizedSections || null;

    // ── Mode 1: fetch from saved report if not provided in body ─────────────
    if (!optimizedSections) {
      const report = await interviewReportModel.findOne({
        _id: reportId,
        user: req.auth.userId,
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found." });
      }

      if (!report.atsOptimization?.optimizedSections) {
        return res.status(422).json({
          message:
            "This report does not have ATS optimisation data saved yet. " +
            "Call POST /api/interview/optimize-resume first, then save the result via " +
            "PATCH /api/interview/report/:id with { atsOptimization: optimization }. " +
            "Alternatively, pass 'optimizedSections' directly in this request body.",
        });
      }

      optimizedSections = report.atsOptimization.optimizedSections;
    }

    // ── Validate minimum content ────────────────────────────────────────────
    const hasContent =
      (optimizedSections.summary &&
        optimizedSections.summary.trim().length > 0) ||
      (optimizedSections.experience &&
        optimizedSections.experience.length > 0) ||
      (optimizedSections.skills && optimizedSections.skills.length > 0);

    if (!hasContent) {
      return res.status(400).json({
        message:
          "'optimizedSections' must contain at least one of: summary, skills, or experience.",
      });
    }

    // ── Build HTML template → PDF (no AI call) ──────────────────────────────
    const pdfBuffer = await generatePdfFromOptimizedResume({
      optimizedSections,
      candidateInfo,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=optimized_resume_${reportId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[generateOptimizedResumePdfController]", error.message);
    return res.status(500).json({
      message: "Failed to generate optimised resume PDF.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/comprehensive-prep
 * @desc    Generate a comprehensive interview preparation set from resume text
 *          and a job description. Returns topic-grouped technical questions
 *          (beginner → advanced + real scenarios), behavioral questions with
 *          hints, and a 4–8 week preparation roadmap with daily tasks.
 *
 *          Body:
 *          {
 *            "resumeText":     string,  — required (raw text from /parse-resume)
 *            "jobDescription": string   — required
 *          }
 * @access  Private
 */
async function generateComprehensiveInterviewPrepController(req, res) {
  try {
    const { resumeText, jobDescription } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message:
          "'resumeText' is required and must be at least 50 characters. " +
          "Use POST /api/interview/parse-resume to extract text from a PDF.",
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message:
          "'jobDescription' is required and must be at least 20 characters.",
      });
    }

    // ── Generate comprehensive prep via Gemini ─────────────────────────────
    const prepData = await generateComprehensiveInterviewPrep({
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
    });

    return res.status(200).json({
      message: "Comprehensive interview preparation generated successfully.",
      meta: {
        totalTopics: prepData.technical.length,
        totalTechnicalQuestions: prepData.technical.reduce(
          (sum, t) => sum + t.questions.length,
          0,
        ),
        totalBehavioralQuestions: prepData.behavioral.length,
      },
      ...prepData,
    });
  } catch (error) {
    console.error(
      "[generateComprehensiveInterviewPrepController]",
      error.message,
    );
    return res.status(500).json({
      message: "Failed to generate comprehensive interview preparation.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/interview/resume/pdf/design-preserved/:reportId
 * @desc    Generate an ATS-optimised resume PDF that preserves the EXACT
 *          design and layout of the candidate's original uploaded resume.
 *          Uses Gemini to replicate the layout + Puppeteer for PDF rendering.
 *
 *          The original resume text is fetched from the saved report.
 *          ATS optimisation data is fetched from the report or accepted in body.
 *
 *          Body (all optional):
 *          {
 *            "optimizedSections": object,  — overrides DB value when provided
 *            "candidateInfo": { name, email, phone, linkedin, location }
 *          }
 * @access  Private
 */
async function generateDesignPreservingResumePdfController(req, res) {
  try {
    const { reportId } = req.params;
    const { optimizedSections: bodyOptimizedSections, candidateInfo = {} } =
      req.body;

    // ── Fetch the report ─────────────────────────────────────────────────────
    const report = await interviewReportModel.findOne({
      _id: reportId,
      user: req.auth.userId,
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    // ── Get original resume text ─────────────────────────────────────────────
    const originalResumeText = report.resume;
    if (!originalResumeText || originalResumeText.trim().length < 50) {
      return res.status(422).json({
        message:
          "This report does not have the original resume text saved. " +
          "The design-preserving PDF requires the original resume to replicate its layout.",
      });
    }

    // ── Get optimised content ────────────────────────────────────────────────
    let optimizedSections = bodyOptimizedSections || null;

    if (!optimizedSections) {
      if (!report.atsOptimization?.optimizedSections) {
        return res.status(422).json({
          message:
            "This report does not have ATS optimisation data saved yet. " +
            "Call POST /api/interview/optimize-resume first, then save the result via " +
            "PATCH /api/interview/report/:id with { atsOptimization: optimization }. " +
            "Alternatively, pass 'optimizedSections' directly in this request body.",
        });
      }
      optimizedSections = report.atsOptimization.optimizedSections;
    }

    // ── Validate minimum content ─────────────────────────────────────────────
    const hasContent =
      (optimizedSections.summary &&
        optimizedSections.summary.trim().length > 0) ||
      (optimizedSections.experience &&
        optimizedSections.experience.length > 0) ||
      (optimizedSections.skills && optimizedSections.skills.length > 0);

    if (!hasContent) {
      return res.status(400).json({
        message:
          "'optimizedSections' must contain at least one of: summary, skills, or experience.",
      });
    }

    // ── Generate design-preserving PDF ────────────────────────────────────────
    const pdfBuffer = await generateDesignPreservingResumePdf({
      originalResumeText,
      optimizedSections,
      candidateInfo,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=design_preserved_resume_${reportId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error(
      "[generateDesignPreservingResumePdfController]",
      error.message,
    );
    return res.status(500).json({
      message: "Failed to generate design-preserving resume PDF.",
      error: error.message,
    });
  }
}

module.exports = {
  parseResumeController,
  analyzeJobDescriptionController,
  detectSkillGapController,
  generateInterviewQuestionsController,
  createReportController,
  updateReportController,
  deleteReportController,
  optimizeResumeController,
  generateOptimizedResumePdfController,
  generateDesignPreservingResumePdfController,
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  generateComprehensiveInterviewPrepController,
};
