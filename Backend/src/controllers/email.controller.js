const { generateColdEmails } = require("../services/email.service");

/**
 * @route   POST /api/email/generate
 * @desc    Generate 3–5 personalized cold emails for job/internship outreach.
 *          Stateless — emails are NOT persisted to the database.
 *
 *          Body:
 *          {
 *            "resumeData":     object,  — required: parsed resume { skills, experience, education, summary, projects? }
 *            "jobDescription": string,  — required: target job description
 *            "targetRole":     string,  — required: the role being applied for
 *            "companyName":    string   — optional: company name for personalization
 *          }
 * @access  Private
 */
async function generateColdEmailsController(req, res) {
  try {
    const { resumeData, jobDescription, targetRole, companyName } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!resumeData || typeof resumeData !== "object") {
      return res.status(400).json({
        message:
          "'resumeData' is required and must be an object containing parsed resume data. " +
          "Use POST /api/interview/parse-resume to obtain it.",
      });
    }

    if (
      !resumeData.skills &&
      !resumeData.experience &&
      !resumeData.education
    ) {
      return res.status(400).json({
        message:
          "'resumeData' must contain at least one of: skills, experience, or education.",
      });
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
      return res.status(400).json({
        message:
          "'jobDescription' is required and must be at least 20 characters.",
      });
    }

    if (!targetRole || typeof targetRole !== "string" || targetRole.trim().length < 2) {
      return res.status(400).json({
        message:
          "'targetRole' is required (e.g. 'Frontend Engineer', 'Full-Stack Developer').",
      });
    }

    // ── Generate cold emails via Gemini ──────────────────────────────────────
    const result = await generateColdEmails({
      resumeData,
      jobDescription: jobDescription.trim(),
      targetRole: targetRole.trim(),
      companyName: companyName ? companyName.trim() : null,
    });

    return res.status(200).json({
      message: "Cold emails generated successfully.",
      targetRole: targetRole.trim(),
      companyName: companyName ? companyName.trim() : null,
      totalEmails: result.emails.length,
      ...result,
    });
  } catch (error) {
    console.error("[generateColdEmailsController]", error.message);
    return res.status(500).json({
      message: `Failed to generate cold emails: ${error.message}`,
      error: error.message,
    });
  }
}

module.exports = {
  generateColdEmailsController,
};
