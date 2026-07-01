import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import hpp from "hpp";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";
import { errorMiddleware } from "./src/middlewares/errorMiddleware.js";
import rootRouter from "./src/routes/index.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// ES module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Standard Middlewares & CORS (Applied first to ensure all downstream responses have CORS headers)
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));

// 2. Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP if it blocks static files/external CDNs
}));
app.use(hpp()); // Prevents HTTP Parameter Pollution

// Rate Limiting (Applied after CORS so rate limit responses include CORS headers)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit for SPA active usage
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// 3. Static Files
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// 4. Routes
app.get("/", (req, res) => {
  res.json({ message: "MedAI Connect API is running" });
});

app.use("/api/v1", rootRouter);
app.use("/api", rootRouter);

// 5. React Catch-All Route (Must be after API routes and static files)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// 6. Error Handling (Must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📡 Port: ${PORT}
  🔗 URL: http://localhost:${PORT}
  `);
});