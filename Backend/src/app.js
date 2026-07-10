const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* Routes — auth is handled by Clerk */
const interviewRouter = require("./routes/interview.routes");
const emailRouter = require("./routes/email.routes");
const resumeRouter = require("./routes/resume.routes");

app.use("/api/interview", interviewRouter);
app.use("/api/email", emailRouter);
app.use("/api/resume", resumeRouter);

app.get("/", (req, res) => {
  res.json({
    message: "GoGetHired Backend is running!",
    status: "healthy",
    database: "connected",
  });
});

module.exports = app;
