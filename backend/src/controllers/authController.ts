import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: "30d",
    });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            res.status(400).json({ message: "Please provide fullName, email and password" });
            return;
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // No API key is generated at registration.
        // The user must visit the Integrations page to generate primary/fallback keys.
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                isOnboarded: user.isOnboarded,
                profileImage: user.profileImage,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                isOnboarded: user.isOnboarded,
                profileImage: user.profileImage,
                // Never return the raw key — only indicate whether one has been generated.
                // To get/rotate keys, use GET/POST /api/user/api-key-status or /generate-api-key
                hasPrimaryKey: !!(user as any).primaryApiKeyHash,
                token: generateToken(user._id.toString()),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as any).user._id).select("-password");

        if (user) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                isOnboarded: user.isOnboarded,
                onboardingStep: user.onboardingStep,
                companyName: user.companyName,
                industry: user.industry,
                websiteUrl: user.websiteUrl,
                chatbotPersonality: user.chatbotPersonality,
                chatbotPurpose: user.chatbotPurpose,
                supportedLanguages: user.supportedLanguages,
                knowledgeBaseSetup: user.knowledgeBaseSetup,
                profileImage: user.profileImage,
                // Keys are NEVER returned from /me — use GET /api/user/api-key-status
                hasPrimaryKey: !!(user as any).primaryApiKeyHash,
            });
            return;
        }

        res.status(404).json({ message: "User not found" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        if (!req.file) {
            res.status(400).json({ message: "No image file provided" });
            return;
        }

        const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage: profileImageUrl },
            { returnDocument: "after" }
        ).select("-password");

        if (updatedUser) {
            res.json({
                message: "Profile image updated successfully",
                profileImage: updatedUser.profileImage,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as any).user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                isOnboarded: updatedUser.isOnboarded,
                profileImage: updatedUser.profileImage,
                token: generateToken(updatedUser._id.toString()),
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

