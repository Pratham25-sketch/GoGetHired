import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
  token,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  formData.append("resume", resumeFile);

  const response = await api.post("/api/interview/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...authHeader(token),
    },
  });

  return response.data;
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId, token) => {
  const response = await api.get(`/api/interview/report/${interviewId}`, {
    headers: authHeader(token),
  });

  return response.data;
};

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async (token) => {
  const response = await api.get("/api/interview/", {
    headers: authHeader(token),
  });

  return response.data;
};

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId, token }) => {
  const response = await api.post(
    `/api/interview/resume/pdf/${interviewReportId}`,
    null,
    {
      headers: authHeader(token),
      responseType: "blob",
    },
  );

  return response.data;
};

/**
 * @description Step 6 — Send resume text + JD to Gemini for ATS optimisation.
 *              Returns scores, rewritten sections, keywords inserted, and tips.
 */
export const optimizeResumeForATS = async ({
  resumeText,
  jobDescription,
  parsedResume = null,
  jdAnalysis = null,
  token,
}) => {
  const response = await api.post(
    "/api/interview/optimize-resume",
    { resumeText, jobDescription, parsedResume, jdAnalysis },
    { headers: authHeader(token) },
  );

  return response.data;
};

/**
 * @description Step 7 — Convert optimized resume sections into a downloadable PDF.
 *              Passes optimizedSections directly (body mode — no DB save required).
 */
export const downloadOptimizedPdf = async ({
  reportId,
  optimizedSections,
  candidateInfo = {},
  token,
}) => {
  const response = await api.post(
    `/api/interview/resume/pdf/optimized/${reportId}`,
    { optimizedSections, candidateInfo },
    { headers: authHeader(token), responseType: "blob" },
  );

  return response.data;
};

/**
 * @description Delete an interview report by ID (scoped to the logged-in user).
 */
export const deleteInterviewReport = async (reportId, token) => {
  const response = await api.delete(`/api/interview/report/${reportId}`, {
    headers: authHeader(token),
  });

  return response.data;
};

/**
 * @description Generate a design-preserving ATS-optimised resume PDF.
 *              Keeps the original resume's layout while using improved content.
 */
export const downloadDesignPreservedPdf = async ({
  reportId,
  optimizedSections,
  candidateInfo = {},
  token,
}) => {
  const response = await api.post(
    `/api/interview/resume/pdf/design-preserved/${reportId}`,
    { optimizedSections, candidateInfo },
    { headers: authHeader(token), responseType: "blob" },
  );

  return response.data;
};
