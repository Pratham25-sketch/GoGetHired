import { createBrowserRouter, Navigate } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import ColdEmails from "./features/tools/pages/ColdEmails";
import ResumeOptimizer from "./features/tools/pages/ResumeOptimizer";
import Landing from "./pages/Landing";

export const router = createBrowserRouter([
    // ── Public Routes ────────────────────────────────────────────
    {
        path: "/",
        element: <Landing />
    },

    // ── Auth Routes ──────────────────────────────────────────────
    {
        path: "/sign-in/*",
        element: <Login />
    },
    {
        path: "/sign-up/*",
        element: <Register />
    },
    // Legacy routes → redirect to new auth paths
    {
        path: "/login/*",
        element: <Navigate to="/sign-in" replace />
    },
    {
        path: "/register/*",
        element: <Navigate to="/sign-up" replace />
    },

    // ── Protected Routes ─────────────────────────────────────────
    {
        path: "/dashboard",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/tools/cold-emails",
        element: <Protected><ColdEmails /></Protected>
    },
    {
        path: "/tools/resume-optimizer",
        element: <Protected><ResumeOptimizer /></Protected>
    }
])