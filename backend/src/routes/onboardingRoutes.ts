import express from "express";
import { protect } from "../middleware/authMiddleware";
import { saveOnboarding } from "../controllers/onboardingController";

const router = express.Router();

router.post("/", protect, saveOnboarding);

export default router;
