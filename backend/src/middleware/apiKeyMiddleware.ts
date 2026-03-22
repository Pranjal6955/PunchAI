import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import apiKeyService from "../services/apiKeyService";

export const verifyApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const rawKey = req.header("x-api-key");

        if (!rawKey) {
            res.status(401).json({ message: "API key is missing" });
            return;
        }

        const hash = apiKeyService.hashKey(rawKey);

        // ── 1. Primary key lookup ──────────────────────────────────────────
        let user = await User.findOne({ primaryApiKeyHash: hash });

        if (user) {
            (req as any).user = user;
            (req as any).apiKeyType = "primary";
            return next();
        }

        // ── 2. Fallback key lookup ─────────────────────────────────────────
        user = await User.findOne({ fallbackApiKeyHash: hash });

        if (user) {
            console.warn(
                `[ApiKeyMiddleware] Request authenticated with FALLBACK key for user ${user._id}. ` +
                `Consider rotating the primary key and revoking the fallback.`
            );
            (req as any).user = user;
            (req as any).apiKeyType = "fallback";
            return next();
        }

        // ── 3. Legacy hash lookup (migration) ─────────────────────────────
        user = await User.findOne({ apiKeyHash: hash });

        if (user) {
            console.warn(`[ApiKeyMiddleware] User ${user._id} using legacy hashed key — rotate to primary.`);
            (req as any).user = user;
            (req as any).apiKeyType = "legacy";
            return next();
        }

        // ── 4. Legacy plaintext lookup (oldest migration path) ─────────────
        user = await User.findOne({ apiKey: rawKey });

        if (user) {
            console.warn(`[Security] User ${user._id} authenticated with legacy PLAINTEXT key. Urgent: regenerate via dashboard.`);
            (req as any).user = user;
            (req as any).apiKeyType = "legacy-plaintext";
            return next();
        }

        res.status(401).json({ message: "Invalid API key" });
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
