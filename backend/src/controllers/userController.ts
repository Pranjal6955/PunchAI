import { Request, Response } from "express";
import apiKeyService, { ApiKeyType } from "../services/apiKeyService";

/**
 * POST /api/user/generate-api-key
 * Body: { type: "primary" | "fallback" }
 *
 * Rotates the specified key slot.
 * The raw key is returned exactly ONCE — store it safely.
 */
export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const type: ApiKeyType = req.body.type === "fallback" ? "fallback" : "primary";

        const rawKey = await apiKeyService.rotateKey(userId, type);

        res.status(200).json({
            success: true,
            type,
            apiKey: rawKey,
            message: `${type === "primary" ? "Primary" : "Fallback"} API key generated. Store it safely — it will NOT be shown again.`,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to generate API key",
            error: error.message,
        });
    }
};

/**
 * DELETE /api/user/fallback-api-key
 *
 * Permanently revokes the fallback key.
 * Use after you've updated all widgets to the new primary key.
 */
export const revokeFallbackKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        await apiKeyService.revokeFallbackKey(userId);

        res.status(200).json({
            success: true,
            message: "Fallback API key revoked successfully.",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to revoke fallback key",
            error: error.message,
        });
    }
};

/**
 * GET /api/user/api-key-status
 *
 * Returns whether each key slot is active and its creation date.
 * Never returns the raw key — that's shown only once on generation.
 */
export const getApiKeyStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const status = await apiKeyService.getKeyStatus(userId);

        res.status(200).json({ success: true, status });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch API key status",
            error: error.message,
        });
    }
};
