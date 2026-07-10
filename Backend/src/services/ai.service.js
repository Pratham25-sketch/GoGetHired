const { GoogleGenAI } = require("@google/genai");
// parseResume schema + function added below existing exports
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    ),
  technicalQuestions: z
    .array(
      z.object({
        topic: z
          .string()
          .describe(
            "The technology, concept, or project topic being assessed " +
              "(e.g. 'React', 'JavaScript', 'System Design', 'DSA')",
          ),
        questions: z
          .array(
            z.object({
              level: z
                .enum([
                  "beginner",
                  "intermediate",
                  "advanced",
                  "real-interview-scenario",
                ])
                .describe("Difficulty tier of the question"),
              question: z
                .string()
                .describe("The interview question — concise but deep"),
              intention: z
                .string()
                .describe(
                  "What the interviewer is trying to assess with this question",
                ),
              answer: z
                .string()
                .describe(
                  "A model answer covering key points, approach, and concepts to mention",
                ),
              followups: z
                .array(z.string())
                .describe(
                  "1–2 follow-up questions the interviewer might ask to probe deeper. " +
                    "Empty array if not applicable.",
                ),
            }),
          )
          .describe(
            "No limit on count — 2–5 beginner, 3–6 intermediate, 3–6 advanced, 2–4 scenario questions per topic",
          ),
      }),
    )
    .describe(
      "Technical questions grouped by topic — technologies, concepts (DSA, DBMS, OS, System Design), and projects",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "Behavioral interview question based on projects, resume claims, " +
              "leadership, teamwork, or failure scenarios",
          ),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question using STAR method, what points to cover",
          ),
        hint: z
          .string()
          .describe(
            "What the interviewer expects — key themes and what a strong answer looks like",
          ),
      }),
    )
    .describe(
      "10–20 behavioral questions derived from the candidate's resume, projects, and experience",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `You are an expert technical interviewer and career coach.

Your task is to deeply analyze the candidate's resume and generate a COMPLETE interview preparation set.

---

## GOAL

DO NOT limit the number of questions.
Generate as many questions as required to fully prepare the candidate.

---

## INPUT

Resume Data:
${resume}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}

---

## STEP 1: ANALYZE RESUME

Extract and categorize:
* Technologies (React, Node, MongoDB, etc.)
* Concepts (DSA, System Design, DBMS, OS, etc.)
* Projects
* Experience level

## STEP 2: GROUP INTO TOPICS

Group all extracted items into distinct topics like:
* React
* JavaScript
* Backend (Node/Express)
* Databases
* System Design
* Projects
(and any other relevant topics found in the resume)

## STEP 3: GENERATE QUESTIONS PER TOPIC

For EACH topic, generate:
1. Beginner Questions (2–5)
2. Intermediate Questions (3–6)
3. Advanced Questions (3–6)
4. Real Interview Scenario Questions (2–4)

## STEP 4: INCLUDE FOLLOW-UP QUESTIONS

For each important question:
* Add 1–2 follow-ups like a real interviewer

## STEP 5: BEHAVIORAL QUESTIONS

Generate 10–20 behavioral questions based on:
* Projects
* Resume claims
* Leadership / teamwork
* Failure scenarios

## STEP 6: SKILL GAPS AND PREPARATION

* Identify skill gaps between resume and job description
* Create a day-wise preparation plan

---

## IMPORTANT RULES

* DO NOT limit output size
* Cover ALL resume topics
* Be realistic (like FAANG interviews)
* Avoid generic questions
* Focus on depth and coverage
* Format all "answer" and "hint" fields STRICTLY using markdown bullet points for better readability. DO NOT use long solid paragraphs.
* Also output matchScore (0-100), skillGaps, preparationPlan, and title`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  const result = JSON.parse(response.text);

  // ── Debug logs ────────────────────────────────────────────────────────────
  console.log("──────────────────────────────────────────────────");
  console.log("Generated technical topics:", result.technicalQuestions?.length);
  console.log(
    "Total technical questions:",
    result.technicalQuestions?.reduce((sum, t) => sum + (t.questions?.length || 0), 0),
  );
  console.log("Total behavioral questions:", result.behavioralQuestions?.length);
  console.log("Skill gaps:", result.skillGaps?.length);
  console.log("Preparation plan days:", result.preparationPlan?.length);
  console.log("──────────────────────────────────────────────────");

  return result;
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

// ── Resume Parsing ────────────────────────────────────────────────────────────

const parsedResumeSchema = z.object({
  personalInfo: z
    .object({
      name: z.string().describe("Candidate's full name"),
      email: z.string().describe("Candidate's email address"),
      github: z.string().optional().describe("GitHub profile link"),
      linkedin: z.string().optional().describe("LinkedIn profile link"),
      portfolio: z.string().optional().describe("Personal portfolio or website link"),
    })
    .optional()
    .describe("Personal contact information extracted from the resume"),
  skills: z
    .array(z.string())
    .describe(
      "All technical skills, tools, frameworks, libraries, and programming languages mentioned in the resume",
    ),
  experience: z
    .array(
      z.object({
        company: z.string().describe("Company or organisation name"),
        role: z.string().describe("Job title or role"),
        duration: z
          .string()
          .describe(
            "Employment duration, e.g. 'Jan 2020 – Mar 2022' or '2 years'",
          ),
        description: z
          .string()
          .describe("Key responsibilities and achievements in this role"),
      }),
    )
    .describe("Work experience entries in reverse chronological order"),
  education: z
    .array(
      z.object({
        institution: z.string().describe("University, college, or school name"),
        degree: z
          .string()
          .describe("Degree type, e.g. Bachelor of Science, MBA"),
        field: z.string().describe("Field or major of study"),
        year: z
          .string()
          .describe("Graduation year or date range, e.g. '2018 – 2022'"),
      }),
    )
    .describe("Education entries in reverse chronological order"),
  projects: z
    .array(
      z.object({
        name: z.string().describe("Project name or title"),
        description: z.string().describe("Project description and key achievements"),
        techStack: z.array(z.string()).describe("Technologies, frameworks, and tools used in this project"),
      })
    )
    .optional()
    .describe("Personal, academic, or professional projects mentioned in the resume"),
  summary: z
    .string()
    .describe(
      "A brief 2–3 sentence professional summary highlighting the candidate's core strengths",
    ),
});

/**
 * Parses raw resume text with Gemini and returns structured
 * { skills, experience, education, summary }.
 *
 * @param {string} resumeText - Plain text extracted from the PDF
 * @returns {Promise<{ skills: string[], experience: object[], education: object[], summary: string }>}
 */
async function parseResume(resumeText) {
  const prompt = `You are an expert resume parser.
Extract structured information from the resume text below.
Be thorough: capture every skill, every job, and every educational qualification mentioned.

Resume Text:
---
${resumeText}
---

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(parsedResumeSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── Job Description Analysis ──────────────────────────────────────────────────

const jdAnalysisSchema = z.object({
  jobTitle: z
    .string()
    .describe("The exact job title extracted from the description"),
  experienceLevel: z
    .enum(["entry", "junior", "mid", "senior", "lead", "executive"])
    .describe("The seniority or experience level required for the role"),
  workMode: z
    .enum(["remote", "hybrid", "onsite", "unspecified"])
    .describe("Work arrangement if mentioned, otherwise 'unspecified'"),
  requiredSkills: z
    .array(
      z.object({
        skill: z
          .string()
          .describe(
            "Skill name — technical (e.g. React, Python, AWS) or soft (e.g. communication)",
          ),
        priority: z
          .enum(["must-have", "nice-to-have"])
          .describe(
            "'must-have' if the JD marks it as required/mandatory, " +
              "'nice-to-have' if it is preferred/bonus",
          ),
      }),
    )
    .describe(
      "Every skill, tool, framework, and qualification mentioned in the job description",
    ),
  keywords: z
    .array(z.string())
    .describe(
      "Important ATS keywords and domain-specific phrases that appear " +
        "repeatedly or are central to the role — useful for resume optimisation",
    ),
  responsibilities: z
    .array(z.string())
    .describe(
      "Key day-to-day responsibilities and duties listed in the description",
    ),
  preferredQualifications: z
    .array(z.string())
    .describe(
      "Preferred but not strictly required qualifications, certifications, or experiences",
    ),
});

/**
 * Analyses a job description text with Gemini and returns structured data:
 * { jobTitle, experienceLevel, workMode, requiredSkills, keywords,
 *   responsibilities, preferredQualifications }
 *
 * @param {string} jdText - Raw job description text
 * @returns {Promise<object>}
 */
async function analyzeJobDescription(jdText) {
  const prompt = `You are an expert job description analyst and ATS specialist.
Carefully read the job description below and extract structured information.

Rules:
- Classify each skill as "must-have" if the JD uses words like "required", "must", "essential", "minimum".
- Classify as "nice-to-have" if the JD uses words like "preferred", "bonus", "plus", "nice to have".
- When in doubt, default to "must-have" for technical skills listed without qualification.
- Keywords should be specific phrases an ATS system would scan for (technologies, methodologies, certifications, domain terms).
- Responsibilities must be concise action-oriented statements.

Job Description:
---
${jdText}
---

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(jdAnalysisSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── Skill Gap Detection ───────────────────────────────────────────────────────

const skillGapResultSchema = z.object({
  overallMatchPercentage: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Percentage of job requirements met by the candidate. " +
        "Weight must-have skills more heavily than nice-to-have skills.",
    ),
  summary: z
    .string()
    .describe(
      "A 2-3 sentence overview of the candidate's overall fit for the role",
    ),
  matchedSkills: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("Skill name as it appears in the job requirements"),
        candidateSkill: z
          .string()
          .describe(
            "The exact skill from the candidate's resume that satisfies this requirement",
          ),
        relevance: z
          .enum(["core", "supporting"])
          .describe(
            "'core' if this is a primary requirement of the role, " +
              "'supporting' if it is secondary or complementary",
          ),
      }),
    )
    .describe(
      "Job-required skills that are present (or have a close equivalent) in the resume",
    ),
  missingSkills: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("Missing skill name as stated in the job description"),
        priority: z
          .enum(["must-have", "nice-to-have"])
          .describe("Importance classification from the job description"),
        importance: z
          .string()
          .describe(
            "One sentence explaining why this skill matters for the role",
          ),
        howToLearn: z
          .string()
          .describe(
            "A brief, specific suggestion on how the candidate can acquire this skill " +
              "(e.g. a course, project, certification, or practice method)",
          ),
      }),
    )
    .describe(
      "Required job skills that are absent from the resume, ordered by priority (must-have first)",
    ),
  strengthAreas: z
    .array(z.string())
    .describe(
      "Areas or skill clusters where the candidate is particularly strong relative to the role",
    ),
  recommendations: z
    .array(z.string())
    .describe(
      "Concrete, prioritised, actionable steps the candidate should take to close the skill gaps " +
        "and improve their overall candidacy for this role",
    ),
});

/**
 * Compares candidate resume skills against job required skills using Gemini
 * and returns a detailed skill gap analysis.
 *
 * @param {{ resumeSkills: string[], jdSkills: Array<{ skill: string, priority: string }> }} param
 * @returns {Promise<object>} { overallMatchPercentage, summary, matchedSkills,
 *                              missingSkills, strengthAreas, recommendations }
 */
async function detectSkillGap({ resumeSkills, jdSkills }) {
  const formattedResumeSkills = resumeSkills
    .map((s, i) => `  ${i + 1}. ${s}`)
    .join("\n");

  const formattedJdSkills = jdSkills
    .map((s, i) => `  ${i + 1}. ${s.skill} [${s.priority}]`)
    .join("\n");

  const prompt = `You are an expert technical recruiter and skills assessor.
Compare the candidate's skills against the job requirements and produce a detailed skill gap analysis.

Candidate's Skills (extracted from resume):
${formattedResumeSkills}

Job Required Skills (extracted from job description):
${formattedJdSkills}

Matching Rules:
- A skill is "matched" if the candidate has it or a functionally equivalent skill.
  Examples of acceptable equivalences:
    • "React" ↔ "React.js"
    • "JS" ↔ "JavaScript"
    • "Postgres" ↔ "PostgreSQL"
    • "Node" ↔ "Node.js"
- Partial coverage is NOT a match (e.g. "JavaScript" does NOT fully cover "TypeScript").
- For overallMatchPercentage: must-have skills count double relative to nice-to-have skills.
- Order missingSkills with must-have entries first.
- recommendations must be specific and prioritised by impact on candidacy.
- strengthAreas should name skill clusters, not individual skills
  (e.g. "Full-stack JavaScript development", not just "React").

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(skillGapResultSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── Interview Question Generation ─────────────────────────────────────────────

const interviewQuestionsSchema = z.object({
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical interview question to ask the candidate"),
        difficulty: z
          .enum(["easy", "medium", "hard"])
          .describe(
            "'easy' for fundamentals any junior should know, " +
              "'medium' for mid-level applied knowledge, " +
              "'hard' for advanced / senior-level depth",
          ),
        topic: z
          .string()
          .describe(
            "The specific technical topic or domain this question covers " +
              "(e.g. 'React hooks', 'SQL indexing', 'System design')",
          ),
        intention: z
          .string()
          .describe(
            "What the interviewer is trying to assess with this question",
          ),
        answer: z
          .string()
          .describe(
            "A model answer covering key points, approach, and concepts to mention",
          ),
        followUpQuestions: z
          .array(z.string())
          .describe(
            "2-3 realistic follow-up questions the interviewer might ask " +
              "to probe deeper after the candidate answers",
          ),
      }),
    )
    .describe("Technical interview questions tailored to the resume and JD"),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The behavioral interview question to ask the candidate"),
        difficulty: z
          .enum(["easy", "medium", "hard"])
          .describe(
            "'easy' for straightforward situational questions, " +
              "'medium' for questions requiring structured reflection, " +
              "'hard' for complex leadership or conflict scenarios",
          ),
        competency: z
          .string()
          .describe(
            "The core competency or soft skill this question assesses " +
              "(e.g. 'Leadership', 'Conflict resolution', 'Adaptability')",
          ),
        intention: z
          .string()
          .describe(
            "What the interviewer is trying to learn about the candidate",
          ),
        answer: z
          .string()
          .describe(
            "How to structure an ideal answer using the STAR method " +
              "(Situation, Task, Action, Result) with specific guidance",
          ),
        followUpQuestions: z
          .array(z.string())
          .describe(
            "2-3 follow-up questions the interviewer might ask to dig deeper",
          ),
      }),
    )
    .describe("Behavioral interview questions tailored to the resume and JD"),
});

/**
 * Generates a tailored set of interview questions (technical + behavioral)
 * with difficulty levels, topic/competency tags, model answers, and follow-ups.
 *
 * @param {{
 *   resumeText:      string,
 *   jobDescription:  string,
 *   difficulty:      "easy"|"medium"|"hard"|"mixed",
 *   technicalCount:  number,
 *   behavioralCount: number
 * }} params
 * @returns {Promise<{ technicalQuestions: object[], behavioralQuestions: object[] }>}
 */
async function generateInterviewQuestions({
  resumeText,
  jobDescription,
  difficulty = "mixed",
  technicalCount = 8,
  behavioralCount = 5,
}) {
  // Build difficulty instruction based on the requested mode
  const difficultyInstruction =
    difficulty === "mixed"
      ? `Distribute difficulty across all questions:
  - ~30% easy   (fundamentals, definitions, basic concepts)
  - ~50% medium (applied knowledge, trade-offs, real scenarios)
  - ~20% hard   (advanced depth, architecture, edge cases)`
      : `All questions must be difficulty level: "${difficulty}".`;

  const prompt = `You are a senior technical interviewer preparing a customised interview question set.

Candidate Resume:
---
${resumeText}
---

Job Description:
---
${jobDescription}
---

Instructions:
1. Generate exactly ${technicalCount} technical questions and exactly ${behavioralCount} behavioral questions.
2. Every question must be directly relevant to the candidate's background AND the job requirements.
3. Technical questions must test skills that appear in both the resume and the JD — do not invent unrelated topics.
4. Behavioral questions must reflect the seniority level and responsibilities implied by the JD.
5. ${difficultyInstruction}
6. For each question provide:
   - A clear, specific question (not vague or generic)
   - The difficulty level
   - The topic/competency being assessed
   - The interviewer's intention
   - A thorough model answer the candidate should aim for
   - 2-3 realistic follow-up questions
7. Model answers for behavioral questions MUST guide the candidate through the STAR method.
8. Do NOT repeat the same topic across multiple questions.

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(interviewQuestionsSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── ATS Resume Optimisation ───────────────────────────────────────────────────

const atsOptimisationSchema = z.object({
  scores: z.object({
    original: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "ATS score for the original resume against this job description (0-100). " +
          "Be honest — most unoptimised resumes score 30-60.",
      ),
    optimized: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Predicted ATS score after applying all optimisations (0-100). " +
          "Should realistically be 15-35 points higher than the original.",
      ),
    breakdown: z.object({
      keywordMatch: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "How well the resume keywords match the job description keywords (0-100)",
        ),
      formatting: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "ATS-friendliness of the resume structure and formatting (0-100). " +
            "Penalise tables, graphics, unusual fonts, and missing standard sections.",
        ),
      sectionCompleteness: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Whether all critical sections (summary, skills, experience, education) " +
            "are present and adequately filled (0-100)",
        ),
      quantifiedAchievements: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Percentage of experience bullet points that contain measurable outcomes " +
            "(numbers, percentages, dollar amounts, time saved) — expressed as 0-100",
        ),
      actionVerbs: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Quality and consistency of action verbs used to start bullet points (0-100). " +
            "Strong verbs: Led, Built, Reduced, Increased. Weak: Helped, Assisted, Worked on.",
        ),
    }),
  }),
  optimizedSections: z.object({
    summary: z
      .string()
      .describe(
        "A rewritten 3-4 sentence professional summary that naturally weaves in " +
          "the most important keywords from the job description without keyword stuffing",
      ),
    skills: z
      .array(z.string())
      .describe(
        "Optimised and expanded skills list — preserve all original skills, " +
          "add missing must-have keywords from the JD, and reorder by JD relevance",
      ),
    experience: z
      .array(
        z.object({
          company: z.string().describe("Company name (unchanged)"),
          role: z.string().describe("Job title (unchanged)"),
          duration: z.string().describe("Employment dates (unchanged)"),
          bullets: z
            .array(z.string())
            .describe(
              "Rewritten bullet points — each must: " +
                "1) start with a strong action verb, " +
                "2) include a measurable outcome where possible, " +
                "3) naturally include relevant JD keywords. " +
                "Minimum 3 bullets per role.",
            ),
        }),
      )
      .describe("All work experience entries with rewritten bullet points"),
    education: z
      .array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          field: z.string(),
          year: z.string(),
        }),
      )
      .describe("Education entries — preserve as-is unless formatting is poor"),
  }),
  keywordsInserted: z
    .array(
      z.object({
        keyword: z
          .string()
          .describe("The exact keyword or phrase inserted from the JD"),
        section: z
          .string()
          .describe(
            "Which section it was inserted into: 'summary', 'skills', or 'experience'",
          ),
        reason: z
          .string()
          .describe(
            "One sentence explaining why this keyword was important to add " +
              "for ATS matching",
          ),
      }),
    )
    .describe(
      "Every keyword from the job description that was inserted into the resume, " +
        "with location and rationale",
    ),
  improvementsMade: z
    .array(z.string())
    .describe(
      "Specific, concrete improvements applied during optimisation — " +
        "e.g. 'Quantified React performance improvement in XYZ role', " +
        "'Replaced weak verb helped with led in ABC bullet'",
    ),
  formattingTips: z
    .array(z.string())
    .describe(
      "ATS formatting best-practice recommendations the candidate should apply " +
        "to their document (font choice, section headers, file format, etc.) — " +
        "these are advisory and independent of the rewritten content",
    ),
});

/**
 * Analyses a resume against a job description, scores it for ATS compatibility,
 * rewrites each section to be keyword-rich and ATS-friendly, and returns a full
 * structured optimisation report.
 *
 * @param {{
 *   resumeText:      string,
 *   jobDescription:  string,
 *   parsedResume?:   object,   — optional Step 1 output for richer context
 *   jdAnalysis?:     object    — optional Step 2 output for precise keyword list
 * }} params
 * @returns {Promise<object>} Full atsOptimisationSchema-shaped result
 */
async function optimizeResumeForATS({
  resumeText,
  jobDescription,
  parsedResume = null,
  jdAnalysis = null,
}) {
  // Build optional enrichment blocks when pre-extracted data is available
  const keywordBlock = jdAnalysis
    ? `\nPre-extracted JD Keywords (use these for precise matching):\n${jdAnalysis.keywords?.join(", ") || "none"}\n` +
      `Required Skills:\n${jdAnalysis.requiredSkills?.map((s) => `  - ${s.skill} [${s.priority}]`).join("\n") || "none"}\n`
    : "";

  const parsedResumeBlock = parsedResume
    ? `\nPre-extracted Resume Skills (preserve all of these):\n${parsedResume.skills?.join(", ") || "none"}\n`
    : "";

  const prompt = `You are a senior ATS (Applicant Tracking System) specialist and professional resume writer.
Your job is to analyse the candidate's resume against the job description, score it for ATS compatibility,
then produce a fully optimised version that will rank highly in ATS systems while remaining readable to humans.

Original Resume:
---
${resumeText}
---

Job Description:
---
${jobDescription}
---
${keywordBlock}${parsedResumeBlock}
Scoring Guidelines:
- Score the ORIGINAL resume honestly before any changes.
- Most unoptimised resumes score between 30 and 60 — do not inflate.
- The optimised score should reflect realistic improvement (typically +15 to +35 points).
- Score each breakdown dimension independently against the criteria in the schema.

Optimisation Rules:
1. NEVER fabricate experience, skills, or qualifications the candidate does not have.
2. Only insert keywords that reflect skills the candidate demonstrably has from their experience.
3. Rewrite bullet points to be action-verb-first and outcome-quantified wherever evidence exists.
4. Weave JD keywords naturally into the summary and experience bullets — do not keyword-stuff.
5. Preserve all company names, job titles, dates, and institutions exactly as written.
6. The skills list must include every original skill PLUS any missing must-have JD keywords
   that are supported by the candidate's actual experience.
7. Every experience entry must have at least 3 bullet points.
8. formattingTips must be actionable and specific (not generic advice).

Return only a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(atsOptimisationSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── ATS-Optimised Resume PDF Generation ──────────────────────────────────────

/**
 * Escapes special HTML characters to prevent rendering issues in the PDF.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds a clean, ATS-friendly HTML document from the structured
 * optimizedSections produced by optimizeResumeForATS (Step 6).
 * Uses system fonts and semantic HTML — no tables, no images, fully parseable.
 *
 * @param {{
 *   summary:    string,
 *   skills:     string[],
 *   experience: Array<{ company: string, role: string, duration: string, bullets: string[] }>,
 *   education:  Array<{ institution: string, degree: string, field: string, year: string }>
 * }} optimizedSections
 * @param {{
 *   name?:     string,
 *   email?:    string,
 *   phone?:    string,
 *   linkedin?: string,
 *   location?: string
 * }} candidateInfo
 * @returns {string} Full HTML document string ready for Puppeteer
 */
function buildOptimizedResumeHtml(optimizedSections, candidateInfo = {}) {
  const {
    summary = "",
    skills = [],
    experience = [],
    education = [],
  } = optimizedSections;

  const {
    name = "Candidate",
    email = "",
    phone = "",
    linkedin = "",
    location = "",
  } = candidateInfo;

  // Contact line — only include non-empty parts
  const contactParts = [email, phone, location, linkedin].filter(Boolean);
  const contactLine = contactParts.map(escapeHtml).join(" &nbsp;|&nbsp; ");

  // Skills — bulleted inline list
  const skillsHtml = skills.length
    ? skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")
    : "";

  // Experience entries
  const experienceHtml = experience
    .map(
      (exp) => `
    <div class="exp-block">
      <div class="exp-header">
        <div>
          <span class="exp-role">${escapeHtml(exp.role)}</span>
          <span class="exp-company">&nbsp;&mdash;&nbsp;${escapeHtml(exp.company)}</span>
        </div>
        <span class="exp-duration">${escapeHtml(exp.duration)}</span>
      </div>
      <ul class="bullets">
        ${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>
    </div>`,
    )
    .join("");

  // Education entries
  const educationHtml = education
    .map(
      (edu) => `
    <div class="edu-block">
      <div class="edu-header">
        <div>
          <span class="edu-degree">${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}</span>
          <div class="edu-institution">${escapeHtml(edu.institution)}</div>
        </div>
        <span class="edu-year">${escapeHtml(edu.year)}</span>
      </div>
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    /* ── Reset ──────────────────────────────────────────────────────────── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Base ────────────────────────────────────────────────────────────  */
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a2e;
      background: #ffffff;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 28px 36px;
    }

    /* ── Header ──────────────────────────────────────────────────────────  */
    .header {
      border-bottom: 2.5px solid #1e3a5f;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }

    .header__name {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #1e3a5f;
    }

    .header__contact {
      margin-top: 5px;
      font-size: 9.5pt;
      color: #4b5563;
    }

    /* ── Section ─────────────────────────────────────────────────────────  */
    .section {
      margin-bottom: 16px;
    }

    .section__title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #1e3a5f;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 3px;
      margin-bottom: 9px;
    }

    /* ── Summary ─────────────────────────────────────────────────────────  */
    .summary-text {
      font-size: 10.5pt;
      color: #374151;
      line-height: 1.6;
    }

    /* ── Skills ──────────────────────────────────────────────────────────  */
    .skills-list {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      padding: 0;
    }

    .skills-list li {
      font-size: 10pt;
      color: #1e3a5f;
      font-weight: 500;
    }

    .skills-list li::before {
      content: "\\25AA ";
      color: #6b7280;
      font-size: 8pt;
    }

    /* ── Experience ──────────────────────────────────────────────────────  */
    .exp-block {
      margin-bottom: 12px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }

    .exp-role {
      font-size: 11pt;
      font-weight: 700;
      color: #111827;
    }

    .exp-company {
      font-size: 10.5pt;
      font-weight: 500;
      color: #374151;
    }

    .exp-duration {
      font-size: 9.5pt;
      color: #6b7280;
      white-space: nowrap;
      margin-left: 10px;
      flex-shrink: 0;
    }

    .bullets {
      list-style: none;
      margin-top: 4px;
      padding: 0;
    }

    .bullets li {
      font-size: 10pt;
      color: #374151;
      padding-left: 14px;
      position: relative;
      margin-bottom: 3px;
      line-height: 1.5;
    }

    .bullets li::before {
      content: "\\25B8";
      position: absolute;
      left: 0;
      top: 1px;
      color: #1e3a5f;
      font-size: 9pt;
    }

    /* ── Education ───────────────────────────────────────────────────────  */
    .edu-block {
      margin-bottom: 8px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .edu-degree {
      font-size: 10.5pt;
      font-weight: 700;
      color: #111827;
    }

    .edu-institution {
      font-size: 10pt;
      color: #4b5563;
      margin-top: 1px;
    }

    .edu-year {
      font-size: 9.5pt;
      color: #6b7280;
      white-space: nowrap;
      margin-left: 10px;
      flex-shrink: 0;
    }

    /* ── Print ───────────────────────────────────────────────────────────  */
    @page { size: A4; }
  </style>
</head>
<body>
  <div class="page">

    <!-- HEADER -->
    <header class="header">
      <h1 class="header__name">${escapeHtml(name)}</h1>
      ${contactLine ? `<p class="header__contact">${contactLine}</p>` : ""}
    </header>

    <!-- PROFESSIONAL SUMMARY -->
    ${
      summary
        ? `<section class="section">
      <h2 class="section__title">Professional Summary</h2>
      <p class="summary-text">${escapeHtml(summary)}</p>
    </section>`
        : ""
    }

    <!-- SKILLS -->
    ${
      skills.length
        ? `<section class="section">
      <h2 class="section__title">Skills</h2>
      <ul class="skills-list">${skillsHtml}</ul>
    </section>`
        : ""
    }

    <!-- PROFESSIONAL EXPERIENCE -->
    ${
      experience.length
        ? `<section class="section">
      <h2 class="section__title">Professional Experience</h2>
      ${experienceHtml}
    </section>`
        : ""
    }

    <!-- EDUCATION -->
    ${
      education.length
        ? `<section class="section">
      <h2 class="section__title">Education</h2>
      ${educationHtml}
    </section>`
        : ""
    }

  </div>
</body>
</html>`;
}

/**
 * Converts the structured optimizedSections (from Step 6 — optimizeResumeForATS)
 * into a downloadable A4 PDF using a deterministic HTML template.
 *
 * Key difference from generateResumePdf():
 *   generateResumePdf()             → asks Gemini to write HTML from scratch every time  (slow, non-deterministic)
 *   generatePdfFromOptimizedResume() → renders structured data through a fixed template  (fast, reproducible)
 *
 * @param {{
 *   optimizedSections: {
 *     summary:    string,
 *     skills:     string[],
 *     experience: Array<{ company, role, duration, bullets[] }>,
 *     education:  Array<{ institution, degree, field, year }>
 *   },
 *   candidateInfo?: {
 *     name?:     string,
 *     email?:    string,
 *     phone?:    string,
 *     linkedin?: string,
 *     location?: string
 *   }
 * }} params
 * @returns {Promise<Buffer>} PDF buffer ready to stream to the client
 */
async function generatePdfFromOptimizedResume({
  optimizedSections,
  candidateInfo = {},
}) {
  const html = buildOptimizedResumeHtml(optimizedSections, candidateInfo);
  // Reuse the existing Puppeteer helper — no duplication
  return generatePdfFromHtml(html);
}

// ── Comprehensive Interview Preparation ───────────────────────────────────────

const comprehensiveInterviewPrepSchema = z.object({
  technical: z
    .array(
      z.object({
        topic: z
          .string()
          .describe(
            "The technology, concept, or project topic being assessed " +
              "(e.g. 'React', 'JavaScript', 'Backend (Node/Express)', 'System Design')",
          ),
        questions: z
          .array(
            z.object({
              level: z
                .enum([
                  "beginner",
                  "intermediate",
                  "advanced",
                  "real-interview-scenario",
                ])
                .describe("Difficulty tier of the question"),
              question: z
                .string()
                .describe("The interview question — concise but deep"),
              followups: z
                .array(z.string())
                .describe(
                  "1–2 follow-up questions the interviewer might ask to probe deeper, " +
                    "like a real interview. Empty array if not applicable.",
                ),
            }),
          )
          .describe(
            "No limit on count — generate as many as needed to fully cover the topic: " +
              "2–5 beginner, 3–6 intermediate, 3–6 advanced, 2–4 real-interview-scenario",
          ),
      }),
    )
    .describe(
      "Technical questions grouped by topic — technologies, concepts (DSA, DBMS, OS, System Design), and projects",
    ),
  behavioral: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "Behavioral interview question based on projects, resume claims, " +
              "leadership, teamwork, or failure scenarios",
          ),
        hint: z
          .string()
          .describe(
            "What the interviewer expects — key themes, STAR method pointers, " +
              "and what a strong answer looks like",
          ),
      }),
    )
    .describe(
      "10–20 behavioral questions derived from the candidate's resume, projects, and experience",
    ),
});

/**
 * Generates a comprehensive interview preparation set from a resume and
 * job description: topic-grouped technical questions across 4 difficulty
 * levels with follow-up arrays, and behavioral questions with hints.
 * No question limits — generates as many as needed for full coverage.
 *
 * @param {{ resumeText: string, jobDescription: string }} params
 * @returns {Promise<{ technical: object[], behavioral: object[] }>}
 */
async function generateComprehensiveInterviewPrep({
  resumeText,
  jobDescription,
}) {
  const prompt = `You are an expert technical interviewer and career coach.

Your task is to deeply analyze the candidate's resume and generate a COMPLETE interview preparation set.

---

## GOAL

DO NOT limit the number of questions.

Generate as many questions as required to fully prepare the candidate.

---

## INPUT

Resume Data:
${resumeText}

Job Description:
${jobDescription}

---

## STEP 1: ANALYZE RESUME

Extract and categorize:

* Technologies (React, Node, MongoDB, etc.)
* Concepts (DSA, System Design, DBMS, OS, etc.)
* Projects
* Experience level

---

## STEP 2: GROUP INTO TOPICS

Example:

* React
* JavaScript
* Backend (Node/Express)
* Databases
* System Design
* Projects

---

## STEP 3: GENERATE QUESTIONS PER TOPIC

For EACH topic:

Generate:

### 1. Beginner Questions (2–5)

### 2. Intermediate Questions (3–6)

### 3. Advanced Questions (3–6)

### 4. Real Interview Scenario Questions (2–4)

---

## STEP 4: INCLUDE FOLLOW-UP QUESTIONS

For each important question:

* Add 1–2 follow-ups like a real interviewer

---

## STEP 5: BEHAVIORAL QUESTIONS

Generate 10–20 behavioral questions based on:

* Projects
* Resume claims
* Leadership / teamwork
* Failure scenarios

---

## IMPORTANT RULES

* DO NOT limit output size
* Cover ALL resume topics
* Be realistic (like FAANG interviews)
* Avoid generic questions
* Focus on depth and coverage`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(comprehensiveInterviewPrepSchema),
    },
  });

  return JSON.parse(response.text);
}

// ── Design-Preserving ATS Resume PDF ──────────────────────────────────────────

/**
 * Generates a PDF resume that preserves the EXACT design/layout of the
 * candidate's original resume while replacing content with ATS-optimised text.
 *
 * Flow:
 *   1. Send original resume text + optimised content to Gemini
 *   2. Gemini produces HTML that replicates the original layout pixel-perfectly
 *   3. Puppeteer renders the HTML to an A4 PDF
 *
 * @param {{
 *   originalResumeText: string,
 *   optimizedSections: {
 *     summary:    string,
 *     skills:     string[],
 *     experience: Array<{ company, role, duration, bullets[] }>,
 *     education:  Array<{ institution, degree, field, year }>
 *   },
 *   candidateInfo?: { name?, email?, phone?, linkedin?, location? }
 * }} params
 * @returns {Promise<Buffer>} PDF buffer ready to stream to the client
 */
async function generateDesignPreservingResumePdf({
  originalResumeText,
  optimizedSections,
  candidateInfo = {},
}) {
  const designPreservingSchema = z.object({
    html: z
      .string()
      .describe(
        "Complete HTML document (with inline CSS) that visually replicates " +
          "the original resume's exact design while using the ATS-optimised content. " +
          "Must be ready for Puppeteer PDF generation — no external stylesheets or scripts.",
      ),
  });

  const prompt = `You are a senior full-stack engineer AND document layout expert.

You have TWO inputs:
1. The candidate's ORIGINAL resume (raw text) — this defines the DESIGN to replicate
2. IMPROVED ATS-optimised content — this is the content to USE

---

## YOUR TASK

Generate a COMPLETE HTML document (with full inline CSS) that:
- Visually replicates the EXACT layout, design, and formatting of the original resume
- Uses the IMPROVED content instead of the original content

---

## ⚠️ CRITICAL DESIGN RULES (STRICT)

You MUST preserve from the original resume:
* Same section ORDER (e.g., if Education comes before Projects, keep it that way)
* Same heading STYLE (uppercase, bold, underlined — match exactly)
* Same alignment (left, center, justified)
* Same spacing between sections
* Same bullet STYLE (•, ▸, -, or numbered)
* Same font hierarchy (heading sizes vs body text)
* Same column layout (single column, two column, sidebar)
* Same indentation patterns
* Same visual separators (lines, borders, spacing)
* Same capitalization patterns

---

## 📥 ORIGINAL RESUME (defines the DESIGN):
---
${originalResumeText}
---

## 📥 ATS-OPTIMISED CONTENT (use this content):
---
Summary: ${optimizedSections.summary || "Not provided"}

Skills: ${(optimizedSections.skills || []).join(", ")}

Experience:
${(optimizedSections.experience || [])
  .map(
    (exp) =>
      `${exp.role} at ${exp.company} (${exp.duration})\n${(exp.bullets || []).map((b) => `  • ${b}`).join("\n")}`,
  )
  .join("\n\n")}

Education:
${(optimizedSections.education || [])
  .map(
    (edu) =>
      `${edu.degree}${edu.field ? " in " + edu.field : ""} — ${edu.institution} (${edu.year})`,
  )
  .join("\n")}

Projects:
${(optimizedSections.projects || [])
  .map(
    (proj) =>
      `${proj.name}\n${(proj.bullets || proj.description ? [proj.description || '', ...(proj.bullets || [])] : []).filter(Boolean).map((b) => `  • ${b}`).join("\n")}`,
  )
  .join("\n\n")}
---

Candidate Info:
Name: ${candidateInfo.name || "Candidate"}
Email: ${candidateInfo.email || ""}
Phone: ${candidateInfo.phone || ""}
LinkedIn: ${candidateInfo.linkedin || ""}
Location: ${candidateInfo.location || ""}

---

## 📐 HTML/CSS REQUIREMENTS

1. Use INLINE CSS only (no external stylesheets)
2. Use system fonts: 'Segoe UI', Arial, Helvetica, sans-serif
3. Page should be A4 sized (max-width: 794px for PDF)
4. Use semantic HTML (section, h1, h2, ul, li etc.)
5. NO images, tables for layout, or JavaScript
6. All spacing should use px or pt for precision
7. Include @page { size: A4; margin: 0; } for Puppeteer
8. The HTML must be a COMPLETE document (<!DOCTYPE html> to </html>)

---

## ⚠️ HARD RULES

* If the improved content doesn't perfectly fit the original layout → adapt WORDING, NOT layout
* DO NOT add sections that don't exist in the original
* DO NOT remove sections that exist in the original
* DO NOT change the visual hierarchy
* Match the original's visual "feel" — if it's minimal, stay minimal; if it's detailed, stay detailed

---

## 🎯 GOAL

The generated PDF should look like someone took the original resume document and only edited the text content — the design should be INDISTINGUISHABLE from the original.

Return ONLY a valid JSON object with a single "html" field containing the complete HTML document.`;

  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(designPreservingSchema),
    },
  });

  const { html } = JSON.parse(response.text);
  return generatePdfFromHtml(html);
}

module.exports = {
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
};
