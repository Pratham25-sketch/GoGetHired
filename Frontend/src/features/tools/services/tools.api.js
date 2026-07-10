import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * @description Generate 3–5 personalized cold emails for job/internship outreach.
 *              Stateless — results are not stored in the database.
 */
export const generateColdEmails = async ({
  resumeData,
  jobDescription,
  targetRole,
  companyName = null,
  token,
}) => {
  const response = await api.post(
    "/api/email/generate",
    { resumeData, jobDescription, targetRole, companyName },
    { headers: authHeader(token) },
  );
  return response.data;
};

/**
 * @description Optimize resume content for ATS while preserving section structure.
 *              Returns { education, experience, projects, skills } optimized content.
 *              Stateless — results are not stored in the database.
 */
export const optimizeResumeContent = async ({
  parsedResume,
  jobDescription,
  targetRole = null,
  token,
}) => {
  const response = await api.post(
    "/api/resume/optimize",
    { parsedResume, jobDescription, targetRole },
    { headers: authHeader(token) },
  );
  return response.data;
};
