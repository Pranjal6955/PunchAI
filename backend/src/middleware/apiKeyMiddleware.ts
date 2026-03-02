import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const apiKey = req.header("x-api-key");

        if (!apiKey) {
            res.status(401).json({ message: "API key is missing" });
            return;
        }

        const user = await User.findOne({ apiKey });

        if (!user) {
            res.status(401).json({ message: "Invalid API key" });
            return;
        }

        // Attach user to request
        (req as any).user = user;
        next();
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
