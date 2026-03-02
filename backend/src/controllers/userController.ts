import { Request, Response } from "express";
import apiKeyService from "../services/apiKeyService";

export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;

        const apiKey = await apiKeyService.updateUserApiKey(userId);

        res.status(200).json({
            success: true,
            apiKey: apiKey
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to generate API key",
            error: error.message
        });
    }
};
