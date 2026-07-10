import { createContext, useState } from "react";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  // ── Existing state (unchanged) ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);

  // ── New state for Steps 6 & 7 ───────────────────────────────────────────────
  const [atsOptimization, setAtsOptimization] = useState(null); // Step 6 output
  const [atsLoading, setAtsLoading] = useState(false); // ATS-specific spinner
  const [error, setError] = useState(null); // user-facing error message

  return (
    <InterviewContext.Provider
      value={{
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
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
