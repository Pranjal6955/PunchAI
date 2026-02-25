import express from "express";
import { saveOnboarding, getMe } from "../controllers/onboardingController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, saveOnboarding);

export default router;
