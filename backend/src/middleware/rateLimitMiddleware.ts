import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// ─── Helper: standard rejection handler ───────────────────────────────────
const rateLimitHandler = (req: Request, res: Response) => {
    res.status(429).json({
        message: "Too many requests. Please slow down and try again later.",
        retryAfter: res.getHeader("Retry-After"),
    });
};

// ─── 1. Global limiter — all routes ──────────────────────────────────────
// 200 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    message: "Too many requests from this IP, please try again after 15 minutes.",
});

// ─── 2. Auth limiter — registration & login ──────────────────────────────
// 15 attempts per 15 minutes per IP (prevents brute-force)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skipSuccessfulRequests: true, // only count failed attempts
});

// ─── 3. Chat limiter — public API key endpoint ───────────────────────────
// Keyed by API key header (not IP) so each tenant gets their own budget.
// Falls back to IP if no key present.
// 60 messages per minute per API key
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
        // Rate-limit per API key so a spammy widget can't affect others
        return (req.headers["x-api-key"] as string) || req.ip || "unknown";
    },
    handler: rateLimitHandler,
});

// ─── 4. API key generation limiter ───────────────────────────────────────
// 20 regenerations per hour per user (prevents enumeration attacks)
// Skipped entirely in development so testing isn't blocked.
export const apiKeyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: () => process.env.NODE_ENV !== "production",
});
