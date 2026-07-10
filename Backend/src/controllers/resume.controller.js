const { optimizeResumeContent } = require("../services/resume.service");

/**
 * @route   POST /api/resume/optimize
 * @desc    Optimize resume content for ATS compatibility while preserving structure.
 *          Stateless — optimized content is NOT persisted to the database.
 *
 *          Output preserves exact sections: education, experience, projects, skills.
 *
 *          Body:
 *          {
 *            "parsedResume":   object,  — required: parsed resume { skills, experience, education, summary, projects? }
 *            "jobDescription": string,  — required: target job description
 *            "targetRole":     string   — optional: specific role for context
 *          }
 * @access  Private
 */
async function optimizeResumeController(req, res) {
  try {
    const { parsedResume, jobDescription, targetRole } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!parsedResume || typeof parsedResume !== "object") {
      return res.status(400).json({
        message:
          "'parsedResume' is required and must be an object containing parsed resume data. " +
          "Use POST /api/interview/parse-resume to obtain it.",
      });
    }

    if (
      !parsedResume.skills &&
      !parsedResume.experience &&
      !parsedResume.education
    ) {
      return res.status(400).json({
        message:
          "'parsedResume' must contain at least one of: skills, experience, or education.",
      });
    }

    if (
      !jobDescription ||
      typeof jobDescription !== "string" ||
      jobDescription.trim().length < 20
    ) {
      return res.status(400).json({
        message:
          "'jobDescription' is required and must be at least 20 characters.",
      });
    }

    // ── Optimize resume via Gemini ──────────────────────────────────────────
    const optimizedResume = await optimizeResumeContent({
      parsedResume,
      jobDescription: jobDescription.trim(),
      targetRole: targetRole ? targetRole.trim() : null,
    });

    return res.status(200).json({
      message: "Resume optimized successfully.",
      optimized_resume: {
        education: optimizedResume.education,
        experience: optimizedResume.experience,
        projects: optimizedResume.projects,
        skills: optimizedResume.skills,
      },
      summary: optimizedResume.summary,
      atsScore: optimizedResume.atsScore,
      keyChanges: optimizedResume.keyChanges,
    });
  } catch (error) {
    console.error("[optimizeResumeController]", error.message);
    return res.status(500).json({
      message: "Failed to optimize resume.",
      error: error.message,
    });
  }
}

/**
 * @route   POST /api/resume/pdf/design-preserved
 * @desc    Generate an ATS-optimised resume PDF statelessly
 *          Uses Gemini to replicate the layout + Puppeteer for PDF rendering.
 *
 *          Body:
 *          {
 *            "originalResumeText": string,
 *            "optimizedSections": object,
 *            "candidateInfo": object
 *          }
 * @access  Private
 */
async function generateDesignPreservingResumePdfStatelessController(req, res) {
  try {
    const { originalResumeText, optimizedSections, candidateInfo = {} } = req.body;

    if (!originalResumeText || originalResumeText.trim().length < 50) {
      return res.status(422).json({
        message: "originalResumeText is required and must be at least 50 characters.",
      });
    }

    if (!optimizedSections || typeof optimizedSections !== "object") {
      return res.status(400).json({
        message: "optimizedSections is required.",
      });
    }

    const { generateDesignPreservingResumePdf } = require("../services/ai.service");

    const pdfBuffer = await generateDesignPreservingResumePdf({
      originalResumeText,
      optimizedSections,
      candidateInfo,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Optimized_Resume.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[generateDesignPreservingResumePdfStatelessController]", error.message);
    return res.status(500).json({
      message: "Failed to generate design-preserving resume PDF.",
      error: error.message,
    });
  }
}

module.exports = {
  optimizeResumeController,
  generateDesignPreservingResumePdfStatelessController,
};
