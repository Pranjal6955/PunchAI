import express from "express";
import { registerUser, loginUser } from "../controllers/authController";
import { getMe } from "../controllers/onboardingController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;
