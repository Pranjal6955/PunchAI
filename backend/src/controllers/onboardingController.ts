import { Request, Response } from "express";
import User from "../models/User";

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (user) {
            res.json({
                _id: user._id,
                email: user.email,
                isOnboarded: user.isOnboarded,
            });
            return;
        }

        res.status(404).json({ message: "User not found" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const saveOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const { businessName, industry, websiteUrl, chatbotTone, languages } = req.body;

        // Also allow passing userId in body as per request ("Accept userId and onboarding form data"), but use token if available for security
        const userId = req.body.userId || (req.user ? req.user._id : null);

        if (!userId) {
            res.status(400).json({ message: "UserId is required" });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        user.isOnboarded = true;
        user.onboarding = {
            businessName,
            industry,
            websiteUrl,
            chatbotTone,
            languages
        };

        await user.save();

        res.status(200).json({ message: "Onboarding successful", user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
