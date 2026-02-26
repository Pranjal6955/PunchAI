import { Request, Response } from "express";
import User from "../models/User";

export const saveOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const {
            companyName,
            industry,
            websiteUrl,
            chatbotPersonality,
            chatbotPurpose,
            supportedLanguages,
            knowledgeBaseSetup,
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        user.companyName = companyName;
        user.industry = industry;
        user.websiteUrl = websiteUrl;
        user.chatbotPersonality = chatbotPersonality;
        user.chatbotPurpose = chatbotPurpose;
        user.supportedLanguages = supportedLanguages;
        user.knowledgeBaseSetup = knowledgeBaseSetup;
        user.isOnboarded = true;

        await user.save();

        res.status(200).json({
            message: "Onboarding data saved successfully",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                isOnboarded: user.isOnboarded,
                companyName: user.companyName,
                industry: user.industry,
                websiteUrl: user.websiteUrl,
                chatbotPersonality: user.chatbotPersonality,
                chatbotPurpose: user.chatbotPurpose,
                supportedLanguages: user.supportedLanguages,
                knowledgeBaseSetup: user.knowledgeBaseSetup,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
