const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const emailController = require("../controllers/email.controller");

const emailRouter = express.Router();

/**
 * @route   POST /api/email/generate
 * @desc    Generate 3–5 personalized cold emails for job/internship outreach.
 *          Stateless — results are NOT stored in the database.
 *
 *          Body:
 *            resumeData:     object  — required: parsed resume JSON
 *            jobDescription: string  — required: target JD text
 *            targetRole:     string  — required: e.g. "Frontend Engineer"
 *            companyName:    string  — optional: for personalization
 * @access  Private
 */
emailRouter.post(
  "/generate",
  authMiddleware.authUser,
  emailController.generateColdEmailsController,
);

module.exports = emailRouter;
