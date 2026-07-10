import { useUser } from "@clerk/react";
import { Navigate } from "react-router";

const Protected = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <main
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "#0d1117",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.5rem",
          color: "#e6edf3",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff2d78"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "spin 1s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p style={{ fontSize: "0.95rem", color: "#7d8590" }}>
          Verifying authentication…
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
};

export default Protected;
