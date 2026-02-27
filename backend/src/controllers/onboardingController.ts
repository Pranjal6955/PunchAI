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
            onboardingStep,
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        user.companyName = companyName || user.companyName;
        user.industry = industry || user.industry;
        user.websiteUrl = websiteUrl || user.websiteUrl;
        user.chatbotPersonality = chatbotPersonality || user.chatbotPersonality;
        user.chatbotPurpose = chatbotPurpose || user.chatbotPurpose;
        user.supportedLanguages = supportedLanguages || user.supportedLanguages;
        user.knowledgeBaseSetup = knowledgeBaseSetup || user.knowledgeBaseSetup;
        user.onboardingStep = onboardingStep || user.onboardingStep;

        if (req.body.isOnboarded !== undefined) {
            user.isOnboarded = req.body.isOnboarded;
        }

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
                onboardingStep: user.onboardingStep,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
