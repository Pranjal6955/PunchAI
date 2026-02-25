import express, { Application } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

export default app;
