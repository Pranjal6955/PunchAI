import express from "express";
import { generateApiKey, revokeFallbackKey, getApiKeyStatus } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";
import { apiKeyLimiter } from "../middleware/rateLimitMiddleware";

const router = express.Router();

// GET  /api/user/api-key-status     → metadata (active?, createdAt) for each key slot
router.get("/api-key-status", protect, getApiKeyStatus);

// POST /api/user/generate-api-key   → rotate primary or fallback key (body: { type })
router.post("/generate-api-key", protect, apiKeyLimiter, generateApiKey);

// DELETE /api/user/fallback-api-key → permanently revoke fallback key
router.delete("/fallback-api-key", protect, revokeFallbackKey);

export default router;
