const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const resumeController = require("../controllers/resume.controller");

const resumeRouter = express.Router();

/**
 * @route   POST /api/resume/optimize
 * @desc    Optimize resume content for ATS compatibility while preserving
 *          the exact section structure: education, experience, projects, skills.
 *          Stateless — results are NOT stored in the database.
 *
 *          Body:
 *            parsedResume:   object  — required: parsed resume JSON from /parse-resume
 *            jobDescription: string  — required: target JD text
 *            targetRole:     string  — optional: e.g. "Frontend Engineer"
 * @access  Private
 */
resumeRouter.post(
  "/optimize",
  authMiddleware.authUser,
  resumeController.optimizeResumeController,
);

/**
 * @route   POST /api/resume/pdf/design-preserved
 * @desc    Stateless generation of design-preserved PDF summary.
 *          Body: { originalResumeText, optimizedSections, candidateInfo }
 * @access  Private
 */
resumeRouter.post(
  "/pdf/design-preserved",
  authMiddleware.authUser,
  resumeController.generateDesignPreservingResumePdfStatelessController,
);

module.exports = resumeRouter;
