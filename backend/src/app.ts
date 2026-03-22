import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import authRoutes from "./routes/authRoutes";
import onboardingRoutes from "./routes/onboardingRoutes";
import dataSourceRoutes from "./routes/dataSourceRoutes";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";
import { globalLimiter } from "./middleware/rateLimitMiddleware";

const app: Application = express();

// ─── Security headers (helmet) ─────────────────────────────────────────────
app.use(helmet({
    // Allow embedding in iframes only from same origin (widget use-case)
    // To allow all cross-origin embeds: { frameguard: false }
    frameguard: { action: "sameorigin" },
    // Strict CSP — relax as needed for embedded widget origins
    contentSecurityPolicy: false, // Disabled for API-only backend; enable if serving HTML
}));

// ─── CORS ─────────────────────────────────────────────────────────────────
// Allowed origins come from ALLOWED_ORIGINS env var (comma-separated).
// Example: ALLOWED_ORIGINS=https://app.punchai.com,https://widget.punchai.com
const rawOrigins = process.env.ALLOWED_ORIGINS || "";
const allowedOrigins: (string | RegExp)[] = rawOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins.length > 0
            ? (origin, callback) => {
                // Allow requests with no Origin header (server-to-server / curl)
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error(`CORS: origin '${origin}' is not allowed`));
            }
            : true, // In development (no ALLOWED_ORIGINS set), allow all origins
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
        credentials: true,
    })
);

// ─── Body parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" })); // Reject oversized JSON bodies
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Global rate limiter ───────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Static uploads ────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/datasources", dataSourceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

export default app;
