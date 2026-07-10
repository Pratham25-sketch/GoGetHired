const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ── Cold Email Zod Schema ─────────────────────────────────────────────────────

const coldEmailSchema = z.object({
  emails: z
    .array(
      z.object({
        type: z
          .enum(["professional", "confident", "friendly", "concise", "curiosity-driven"])
          .describe("The tone variation of this email"),
        subject: z
          .string()
          .describe("A highly relevant, non-spammy subject line under 60 characters"),
        email: z
          .string()
          .describe("The full email body following the strict human format (100-140 words)"),
      }),
    )
    .min(3)
    .max(5)
    .describe("3 to 5 cold email variations following the exact student/developer format"),
});

// ── Gemini Cold Email Generator ───────────────────────────────────────────────

/**
 * Generates 3–5 personalized cold emails for job/internship outreach.
 *
 * @param {{
 *   resumeData:      object,   — parsed resume JSON { skills, experience, education, summary, projects? }
 *   jobDescription:  string,   — target job description
 *   targetRole:      string,   — the role the candidate is applying for
 *   companyName?:    string    — optional company name for personalization
 * }} params
 * @returns {Promise<{ emails: Array<{ type: string, subject: string, email: string }> }>}
 */
async function generateColdEmails({
  resumeData,
  jobDescription,
  targetRole,
  companyName = null,
}) {
  const companyContext = companyName ? companyName : "your company";

  const skillsList = (resumeData.skills || []).join(", ");
  const experienceBlock = (resumeData.experience || [])
    .map(
      (exp) =>
        `${exp.role || "Role"} at ${exp.company || "Company"}: ${exp.description || ""}`,
    )
    .join("\n");

  const projectsBlock = (resumeData.projects || [])
    .map(
      (proj) =>
        `${proj.name || proj.title || "Project"}: ${proj.description || ""}`,
    )
    .join("\n");

  const educationBlock = (resumeData.education || [])
    .map(
      (edu) =>
        `${edu.degree || ""} in ${edu.field || ""} from ${edu.institution || ""} (${edu.year || ""})`,
    )
    .join("\n");

  const getLink = (network) => {
    if (resumeData.personalInfo) {
      const { email, github, linkedin, portfolio } = resumeData.personalInfo;
      if (network === 'GitHub' && github) return github;
      if (network === 'LinkedIn' && linkedin) return linkedin;
      if (network === 'Portfolio' && portfolio) return portfolio;
      if (network === 'Email' && email) return email;
    }
    return `[Extract/Infer ${network}]`;
  };

  const candidateName = resumeData.personalInfo?.name || "[Full Name]";
  const candidateEmail = getLink('Email');

  const prompt = `Act as a senior recruiter + professional email writer + data extractor.

Your task is to generate **properly formatted, human-like cold emails** using details extracted from the candidate’s resume.

---

## ⚠️ CRITICAL REQUIREMENTS
1. Emails MUST be properly spaced and readable
2. Use **clear line breaks between sections** (use \`\\n\\n\` in the JSON string)
3. DO NOT output everything in one paragraph
4. MUST extract and use:
   * Candidate Name: ${candidateName}
   * College / University (extract from Education section)
   * GitHub: ${getLink('GitHub')}
   * LinkedIn: ${getLink('LinkedIn')}
   * Email: ${candidateEmail}
5. Replace placeholders with actual extracted data
6. Emails must look like real outreach messages (not AI-generated blocks)
7. If any detail is missing → infer intelligently but DO NOT leave generic placeholders like "[Project]".
8. NEVER output continuous text without line breaks. Formatting matters as much as content.

---

## 📥 INPUT

Resume Data:
Skills: ${skillsList || "N/A"}
Experience: ${experienceBlock || "N/A"}
Projects: ${projectsBlock || "N/A"}
Education: ${educationBlock || "N/A"}

Job Description:
${jobDescription.substring(0, 500)}...

Company: ${companyContext}
Role: ${targetRole}

---

## 📧 REQUIRED EMAIL FORMAT (STRICT)

Follow EXACT spacing and structure (simulate the breaks using \`\\n\\n\`):

Hello [Recruiter Name / Sir / Ma’am],

I hope you are doing well. My name is ${candidateName}, and I am a [year] student from [College Name], currently focused on [your domain].

Recently, I worked on [project name or experience], where I [1–2 lines with impact, metrics if possible].

I came across [company name / role] and found it highly aligned with my interests in [relevant area]. I would love to contribute and learn from your team.

If possible, I would really appreciate the opportunity to connect for a quick 10–15 minute conversation.

Portfolio: ${getLink('Portfolio')}
GitHub: ${getLink('GitHub')}
LinkedIn: ${getLink('LinkedIn')}
Email: ${candidateEmail}

Thank you for your time.

Best regards,
${candidateName}

---

## 🧠 EXTRA RULES
* Keep email length: 100–130 words
* Keep tone natural and slightly informal
* Avoid robotic phrases like "I am writing to express"
* Ensure links are on separate lines
* Ensure proper spacing between paragraphs (\`\\n\\n\`)

---

## 🎯 YOUR TASK
Generate 3–5 variations of cold emails using:
* Same exact structure
* Slight variation in tone:
  * confident
  * friendly
  * concise
  * curiosity-driven

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(coldEmailSchema),
    },
  });

  return JSON.parse(response.text);
}

module.exports = {
  generateColdEmails,
};
