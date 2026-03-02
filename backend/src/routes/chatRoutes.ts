import express from "express";
import { handleChatMessage, getChatLogs, getChatById } from "../controllers/chatController";
import { verifyApiKey } from "../middleware/apiKeyMiddleware";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Public Chat API (requires API Key)
router.post("/", verifyApiKey, handleChatMessage);

// Admin Dashboard Chat APIs (requires JWT Auth)
router.get("/logs", protect, getChatLogs);
router.get("/:chatId", protect, getChatById);

export default router;
