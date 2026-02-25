import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

export default app;
