import express, { Application } from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";
import dataSourceRoutes from "./routes/dataSourceRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/datasources", dataSourceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

export default app;
