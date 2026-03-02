import express from "express";
import { generateApiKey } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @route   POST /api/user/generate-api-key
 * @desc    Generate/Regenerate API key for the authenticated user
 * @access  Private
 */
router.post("/generate-api-key", protect, generateApiKey);

export default router;
