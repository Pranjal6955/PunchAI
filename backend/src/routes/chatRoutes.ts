import express from "express";
import { handleChatMessage, handleChatStream, getChatLogs, getChatById } from "../controllers/chatController";
import { verifyApiKey } from "../middleware/apiKeyMiddleware";
import { protect } from "../middleware/authMiddleware";
import { chatLimiter } from "../middleware/rateLimitMiddleware";

const router = express.Router();

// ─── Public: Chat API (API key required + rate limited) ───────────────────
router.post("/", chatLimiter, verifyApiKey, handleChatMessage);
router.post("/stream", chatLimiter, verifyApiKey, handleChatStream);

// ─── Protected: Dashboard / Admin (JWT required) ──────────────────────────
router.get("/logs", protect, getChatLogs);
router.get("/:chatId", protect, getChatById);

export default router;
