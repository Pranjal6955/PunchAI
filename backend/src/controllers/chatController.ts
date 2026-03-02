import { Request, Response } from "express";
import chatService from "../services/chatService";

export const handleChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, message } = req.body;
        const userId = (req as any).user._id;

        if (!sessionId || !message) {
            res.status(400).json({ message: "sessionId and message are required" });
            return;
        }

        const response = await chatService.processMessage(userId, sessionId, message);

        res.status(200).json({ response });
    } catch (error: any) {
        res.status(500).json({ message: "Error processing chat", error: error.message });
    }
};

export const getChatLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const logs = await chatService.getChatLogs(userId);
        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching chat logs", error: error.message });
    }
};

export const getChatById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const userId = (req as any).user._id;

        if (!chatId || typeof chatId !== "string") {
            res.status(400).json({ message: "Invalid chat ID" });
            return;
        }

        const chat = await chatService.getChatById(chatId, userId);

        if (!chat) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }

        res.status(200).json(chat);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching chat", error: error.message });
    }
};
