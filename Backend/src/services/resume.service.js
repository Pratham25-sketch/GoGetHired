const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ── Optimized Resume Content Schema ───────────────────────────────────────────
// Preserves the exact section structure: education, experience, projects, skills

const optimizedResumeSchema = z.object({
  education: z
    .array(
      z.object({
        institution: z.string().describe("University, college, or school name (unchanged)"),
        degree: z.string().describe("Degree type, e.g. Bachelor of Science, MBA (unchanged)"),
        field: z.string().describe("Field or major of study (unchanged)"),
        year: z.string().describe("Graduation year or date range (unchanged)"),
        gpa: z
          .string()
          .describe("GPA if mentioned in the original resume, otherwise empty string"),
        highlights: z
          .array(z.string())
          .describe(
            "Relevant coursework, honors, awards, or activities. " +
              "Optimize wording for ATS but do NOT fabricate. Empty array if none exist.",
          ),
      }),
    )
    .describe(
      "Education entries in reverse chronological order. " +
        "Preserve all original entries — only improve wording of highlights.",
    ),
  experience: z
    .array(
      z.object({
        company: z.string().describe("Company or organization name (unchanged)"),
        role: z.string().describe("Job title or role (unchanged)"),
        duration: z.string().describe("Employment duration (unchanged)"),
        bullets: z
          .array(z.string())
          .describe(
            "Rewritten bullet points. Each MUST: " +
              "1) start with a strong action verb (Led, Built, Reduced, Implemented, Designed, Optimized), " +
              "2) include a measurable outcome where possible (numbers, percentages, time saved), " +
              "3) naturally weave in relevant JD keywords without keyword-stuffing. " +
              "Minimum 3 bullets per role.",
          ),
      }),
    )
    .describe(
      "Work experience entries in reverse chronological order with ATS-optimized bullet points.",
    ),
  projects: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Project name or title (preserve the original name)"),
        techStack: z
          .array(z.string())
          .describe(
            "Technologies, frameworks, and tools used in this project. " +
              "Preserve original stack, add relevant JD keywords only if the project actually used them.",
          ),
        bullets: z
          .array(z.string())
          .describe(
            "Rewritten project description bullets. Each MUST: " +
              "1) start with a strong action verb, " +
              "2) highlight technical depth and impact, " +
              "3) include relevant JD keywords naturally. " +
              "Minimum 2 bullets per project.",
          ),
        link: z
          .string()
          .describe("Project URL/link if available in original resume, otherwise empty string"),
      }),
    )
    .describe(
      "Project entries with ATS-optimized descriptions. " +
        "IMPORTANT: If the original resume has projects, preserve ALL of them. " +
        "If the original resume does NOT have a dedicated projects section, " +
        "extract any projects mentioned in experience and list them here.",
    ),
  skills: z
    .array(z.string())
    .describe(
      "Optimized and expanded skills list. Rules: " +
        "1) Preserve ALL original skills, " +
        "2) Add missing must-have JD keywords that the candidate demonstrably has, " +
        "3) Reorder by JD relevance (most relevant first), " +
        "4) Use standard ATS-friendly naming (e.g. 'JavaScript' not 'JS', 'React.js' not 'React'). " +
        "Do NOT add skills the candidate does not possess.",
    ),
  summary: z
    .string()
    .describe(
      "A rewritten 2–3 sentence professional summary that naturally weaves in " +
        "the most important keywords from the job description. " +
        "Must be specific to the candidate's actual background — no generic filler.",
    ),
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Estimated ATS compatibility score (0–100) of the optimized resume " +
        "against this specific job description. Be realistic — most well-optimized " +
        "resumes score between 65–85.",
    ),
  keyChanges: z
    .array(z.string())
    .describe(
      "List of 5–10 specific, concrete changes made during optimization. " +
        "e.g. 'Added React.js keyword to skills section', " +
        "'Quantified server response time improvement in XYZ role from 200ms to 50ms', " +
        "'Replaced weak verb helped with Led in ABC bullet'",
    ),
});

// ── Gemini Resume Optimizer ───────────────────────────────────────────────────

/**
 * Optimizes resume content for ATS compatibility while preserving structure.
 * Returns { education, experience, projects, skills, summary, atsScore, keyChanges }.
 *
 * @param {{
 *   parsedResume:    object,   — parsed resume JSON { skills, experience, education, summary, projects? }
 *   jobDescription:  string,   — target job description text
 *   targetRole?:     string    — optional: the specific role for context
 * }} params
 * @returns {Promise<object>} Optimized resume content matching optimizedResumeSchema
 */
async function optimizeResumeContent({
  parsedResume,
  jobDescription,
  targetRole = null,
}) {
  const skillsList = (parsedResume.skills || []).join(", ");

  const experienceBlock = (parsedResume.experience || [])
    .map(
      (exp, i) =>
        `${i + 1}. ${exp.role || "Role"} at ${exp.company || "Company"} (${exp.duration || "N/A"})\n   ${exp.description || exp.bullets?.join("\n   ") || "No details"}`,
    )
    .join("\n\n");

  const projectsBlock = (parsedResume.projects || [])
    .map(
      (proj, i) =>
        `${i + 1}. ${proj.name || proj.title || "Project"}${proj.techStack ? ` [${proj.techStack.join(", ")}]` : ""}\n   ${proj.description || proj.bullets?.join("\n   ") || "No details"}`,
    )
    .join("\n\n");

  const educationBlock = (parsedResume.education || [])
    .map(
      (edu, i) =>
        `${i + 1}. ${edu.degree || "Degree"} in ${edu.field || "Field"} — ${edu.institution || "Institution"} (${edu.year || "Year"})`,
    )
    .join("\n");

  const roleContext = targetRole
    ? `\nTarget Role: ${targetRole}\n`
    : "";

  const prompt = `You are a senior ATS (Applicant Tracking System) specialist and professional resume writer.

Your task: Optimize the candidate's resume content to maximize ATS compatibility for the target job description while STRICTLY preserving the original structure.

---

## CANDIDATE'S ORIGINAL RESUME DATA

Summary: ${parsedResume.summary || "Not provided"}

Skills: ${skillsList || "Not provided"}

Experience:
${experienceBlock || "None provided"}

Projects:
${projectsBlock || "None provided — extract any projects mentioned in experience"}

Education:
${educationBlock || "None provided"}
${roleContext}
---

## JOB DESCRIPTION
---
${jobDescription}
---

---

## OPTIMIZATION RULES (STRICT)

### SECTION PRESERVATION
- Keep SAME sections: education, experience, projects, skills
- Keep SAME section ORDER
- Do NOT add sections that don't exist
- Do NOT remove any entries

### CONTENT IMPROVEMENT
- Improve bullet points using strong action verbs + measurable impact
- Add metrics where evidence exists (do NOT fabricate numbers)
- Naturally weave in JD keywords — no keyword stuffing
- Make content ATS-parseable (avoid special characters, tables, images)

### DO NOT
- Change company names, job titles, dates, or institutions
- Fabricate experience, skills, qualifications, or projects
- Add skills the candidate doesn't demonstrably have
- Increase content length excessively (keep it concise)
- Use generic filler phrases

### BULLET POINT FORMAT
Every bullet MUST follow this pattern:
[Strong Action Verb] + [What you did] + [How/Using what] + [Measurable Result]
Example: "Reduced API response time by 60% by implementing Redis caching layer, handling 10K+ daily requests"

### SKILLS OPTIMIZATION
- Preserve all original skills
- Add missing JD keywords ONLY if the candidate's experience supports them
- Use standard naming: "JavaScript" not "JS", "React.js" not "React"
- Order by relevance to the JD (most relevant first)

---

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(optimizedResumeSchema),
    },
  });

  return JSON.parse(response.text);
}

module.exports = {
  optimizeResumeContent,
};
