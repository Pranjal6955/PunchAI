import express from "express";
import { registerUser, loginUser, getMe, uploadProfileImage, updateProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import imageUpload from "../middleware/imageUploadMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/profile-image", protect, imageUpload.single("image"), uploadProfileImage);

export default router;
