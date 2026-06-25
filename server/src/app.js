import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ---------- core middleware ----------
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",");


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Serve locally-uploaded files statically (only relevant when UPLOAD_STRATEGY=local)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---------- health check ----------
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------- routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// ---------- 404 ----------
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ---------- global error handler ----------
app.use((err, req, res, next) => {
  console.error("[error]", err);

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.message?.includes("Only image files")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong on the server.",
  });
});

export default app;
