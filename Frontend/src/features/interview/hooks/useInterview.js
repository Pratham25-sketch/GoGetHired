import { useAuth } from "@clerk/react";
// v1.1 - Force Vite reload
import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  generateResumePdf,
  optimizeResumeForATS,
  downloadOptimizedPdf,
  deleteInterviewReport,
  downloadDesignPreservedPdf,
} from "../services/interview.api";
import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();
  const { getToken } = useAuth();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const {
    // existing
    loading,
    setLoading,
    report,
    setReport,
    reports,
    setReports,
    // new
    atsOptimization,
    setAtsOptimization,
    atsLoading,
    setAtsLoading,
    error,
    setError,
  } = context;

  // ── Existing functions (catch blocks now surface errors) ────────────────────

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);
    setError(null);
    let result = null;
    try {
      const token = await getToken();
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
        token,
      });
      setReport(response.interviewReport);
      result = response.interviewReport;
    } catch (err) {
      console.error("[generateReport]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to generate interview report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
    return result;
  };

  const getReportById = async (id) => {
    setLoading(true);
    setError(null);
    let result = null;
    try {
      const token = await getToken();
      const response = await getInterviewReportById(id, token);
      setReport(response.interviewReport);
      result = response.interviewReport;
    } catch (err) {
      console.error("[getReportById]", err);
      setError(
        err?.response?.data?.message || "Failed to load interview report.",
      );
    } finally {
      setLoading(false);
    }
    return result;
  };

  const getReports = async () => {
    setLoading(true);
    setError(null);
    let result = null;
    try {
      const token = await getToken();
      const response = await getAllInterviewReports(token);
      setReports(response.interviewReports);
      result = response.interviewReports;
    } catch (err) {
      console.error("[getReports]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load your interview reports.",
      );
    } finally {
      setLoading(false);
    }
    return result;
  };

  const getResumePdf = async (interviewReportId) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await generateResumePdf({ interviewReportId, token });
      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[getResumePdf]", err);
      setError(
        err?.response?.data?.message || "Failed to download resume PDF.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── New: Step 6 — ATS Optimisation ─────────────────────────────────────────
  // Uses report.resume (or selfDescription as fallback) + report.jobDescription
  // that are already loaded in context — no extra arguments needed.

  const optimizeForATS = async () => {
    if (!report) {
      setError("No report loaded. Please load a report first.");
      return;
    }

    const resumeText = report.resume || report.selfDescription || "";

    if (!resumeText.trim()) {
      setError(
        "No resume or self-description found in this report. " +
          "Please generate a new report with a PDF resume or self-description.",
      );
      return;
    }

    setAtsLoading(true);
    setAtsOptimization(null);
    setError(null);

    try {
      const token = await getToken();
      const response = await optimizeResumeForATS({
        resumeText,
        jobDescription: report.jobDescription,
        token,
      });
      setAtsOptimization(response.optimization);
    } catch (err) {
      console.error("[optimizeForATS]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to optimise resume. Please try again.",
      );
    } finally {
      setAtsLoading(false);
    }
  };

  // ── New: Step 7 — Download Optimised Resume PDF ─────────────────────────────
  // Passes optimizedSections directly in the body (no DB save required).

  const downloadOptimizedResumePdf = async () => {
    if (!atsOptimization?.optimizedSections) {
      setError("Run ATS Optimisation first before downloading the PDF.");
      return;
    }

    setAtsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const blob = await downloadOptimizedPdf({
        reportId: interviewId || "resume",
        optimizedSections: atsOptimization.optimizedSections,
        token,
      });
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `optimized_resume_${interviewId || "download"}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[downloadOptimizedResumePdf]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to download optimised PDF. Please try again.",
      );
    } finally {
      setAtsLoading(false);
    }
  };

  // ── New: Delete a report and remove it from the local list ──────────────────

  const removeReport = async (reportId) => {
    setError(null);
    try {
      const token = await getToken();
      await deleteInterviewReport(reportId, token);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      console.error("[removeReport]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to delete the report. Please try again.",
      );
    }
  };

  // ── New: Download Design-Preserved Resume PDF ───────────────────────────────
  // Uses the original resume's layout while injecting ATS-optimised content.

  const downloadDesignPreservedResumePdf = async () => {
    if (!atsOptimization?.optimizedSections) {
      setError("Run ATS Optimisation first before downloading the PDF.");
      return;
    }

    setAtsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const blob = await downloadDesignPreservedPdf({
        reportId: interviewId || "resume",
        optimizedSections: atsOptimization.optimizedSections,
        token,
      });
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `design_preserved_resume_${interviewId || "download"}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[downloadDesignPreservedResumePdf]", err);
      setError(
        err?.response?.data?.message ||
          "Failed to download design-preserved PDF. Please try again.",
      );
    } finally {
      setAtsLoading(false);
    }
  };

  // ── Auto-fetch on mount / interviewId change ────────────────────────────────
  // NOTE: Interview.jsx must NOT have its own useEffect for getReportById —
  // this hook already handles it, preventing a double-fetch.

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]);

  return {
    // state
    loading,
    report,
    reports,
    atsOptimization,
    atsLoading,
    error,
    setError,
    // existing actions
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    // new actions
    optimizeForATS,
    downloadOptimizedResumePdf,
    downloadDesignPreservedResumePdf,
    removeReport,
  };
};
