import express from "express";
import { registerUser, loginUser, getMe, uploadProfileImage, updateProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import imageUpload from "../middleware/imageUploadMiddleware";
import { authLimiter } from "../middleware/rateLimitMiddleware";

const router = express.Router();

// Rate-limited auth endpoints (prevents brute-force)
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Protected endpoints
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/profile-image", protect, imageUpload.single("image"), uploadProfileImage);

export default router;
