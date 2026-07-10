# 🚀 GoGetHired: AI-Powered Technical Mock Interview & Career Preparation Platform

GoGetHired is a modern, production-grade SaaS application designed to elevate a candidate's interview readiness and optimize their professional profile. By leveraging the power of **Google Gemini AI** and **Clerk Authentication**, the platform provides end-to-end preparation, from parsing raw resumes to simulating FAANG-level mock interviews and generating ATS-optimized, design-preserving resumes.

---

## 🌟 Key Features

### 1. 📄 AI Resume Parser
* **Direct PDF Extraction:** Upload a PDF resume and extract raw text using structured pdf-parsing.
* **Structured Data Synthesis:** Processes and categorizes raw resume text into personal info, programming skills, professional experiences, academic background, projects, and a brief, punchy professional summary.

### 2. 🎯 Job Description (JD) Analyzer
* **Multi-Format Ingestion:** Paste raw text or upload a PDF job posting.
* **Smart Classification:** Automatically extracts the target job title, experience level (junior, mid, senior, lead), work mode (remote, hybrid, onsite), must-have vs. nice-to-have skills, and critical ATS keywords.

### 3. 🔍 Precision Skill Gap Detector
* **Compatibility Scoring:** Calculates an overall profile match score, weighting must-have skills higher.
* **Actionable Gap Analysis:** Highlights exact matching and missing skills, explains why the missing skills matter for this role, and provides tailored learning paths (courses, projects, certifications) to close the gap.

### 4. 🧠 Tailored Mock Interview Questions Generator
* **Depth & Coverage:** Generates a robust, multi-tier question bank (Beginner, Intermediate, Advanced, and Scenario-based) tailored to the candidate's experience and target job.
* **Interviewer Intention & STAR Answers:** For every question, explains *why* the interviewer is asking it, provides a model answer (guided by the STAR method for behavioral questions), and suggests 2-3 deep-dive follow-up questions.

### 5. ⚡ ATS Resume Optimizer & Builder
* **ATS Compatibility Scoring:** Analyzes the resume against the target JD, scoring it on formatting, keyword match, and action verbs.
* **Professional PDF Generation:** Re-writes sections, injects missing keywords organically, and compiles a clean, downloadable PDF resume.

### 6. 📅 Interactive Multi-Day Prep Scheduler
* Generates a day-by-day study roadmap focusing on high-severity skill gaps, complete with structured daily objectives and concrete action items.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React 19 (Vite)
* **Routing & State:** React Router v7, React Context
* **Styling:** Sass (SCSS) with custom sleek dark themes, custom micro-animations, and glassmorphic UI components.
* **Authentication:** Clerk (`@clerk/react` & `@clerk/themes`)
* **Libraries:** Axios (HTTP client), React Markdown (rendering rich AI outputs)

### Backend
* **Core:** Node.js, Express (v5)
* **Database:** MongoDB via Mongoose (persisting detailed candidate reports)
* **GenAI Engine:** Google Gemini AI SDK (`@google/genai` utilizing `gemini-2.5-flash`)
* **Document Processing:** Puppeteer (headless browser for PDF generation), Multer (multipart form-data handling), PDF-Parse (raw PDF text extraction)
* **Validation:** Zod (structured JSON schema extraction and request checking)

---

## 📁 Project Structure

```bash
interview-ai-yt/
├── Backend/                    # Express Server Codebase
│   ├── src/
│   │   ├── config/             # DB & External service configurations
│   │   ├── controllers/        # Request controllers (interview, email, resume)
│   │   ├── middlewares/        # Auth verification & file uploads
│   │   ├── models/             # Mongoose schemas (reports, history)
│   │   ├── routes/             # REST endpoints definition
│   │   ├── services/           # Heavy business & AI logic (Gemini API, Puppeteer)
│   │   └── app.js              # Express app initialization
│   ├── server.js               # Entry point
│   └── package.json
│
├── Frontend/                   # React Frontend Client
│   ├── public/                 # Static assets (images, icons)
│   ├── src/
│   │   ├── assets/             # Brand logos & graphics
│   │   ├── components/         # Reusable UI widgets
│   │   ├── features/           # Modular features (auth, interview, tools)
│   │   │   ├── auth/           # Login, Register, Protected routes
│   │   │   └── interview/      # Dashboard, mock panel, report views
│   │   ├── style/              # Global styles, variables, & mixins
│   │   ├── App.jsx             # Main container
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   └── package.json
│
└── .gitignore                  # Global workspace ignores
```

---

## 🚀 Setup & Local Installation

### Prerequisites
* **Node.js** (v18+ recommended)
* **MongoDB** (Local instance or MongoDB Atlas URI)
* **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))
* **Clerk Auth Keys** (Register at [Clerk](https://clerk.com/))

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd interview-ai-yt
```

### 2. Configure Backend
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Backend` folder:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/gogethired
   GEMINI_API_KEY=your_gemini_api_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Configure Frontend
1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Frontend` folder:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```
4. Start the frontend client:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 🔒 Security & Best Practices (.gitignore Check)
This project is configured with a strict, root-level `.gitignore` that prevents pushing sensitive environment variables, external logs, and testing scripts to GitHub:
* **Environment Variables:** All `.env` and `.env.local` files are ignored.
* **Logs & Temporary Files:** Error log outputs (`*error.log`), node modules, and local database scripts are strictly excluded from git tracking.
