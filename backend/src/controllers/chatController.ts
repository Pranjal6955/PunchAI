import { Request, Response } from "express";
import chatService from "../services/chatService";
import { runRAGPipelineStream } from "../services/ragService";
import Chat, { IMessage } from "../models/Chat";
import { generateEmbedding } from "../services/embeddingService";
import { searchVectors } from "../services/vector.service";
import { buildContextFromMatches, buildRAGPrompt } from "../services/prompt.builder";

/**
 * POST /api/chat
 *
 * Standard (buffered) response.
 * Returns: { answer, sources }
 */
export const handleChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, message } = req.body;
        const userId = (req as any).user._id;

        if (!sessionId || !message) {
            res.status(400).json({ message: "sessionId and message are required" });
            return;
        }

        if (typeof message !== "string" || message.trim().length === 0) {
            res.status(400).json({ message: "message must be a non-empty string" });
            return;
        }

        const ragResult = await chatService.processMessage(
            userId.toString(),
            sessionId,
            message.trim()
        );

        res.status(200).json({
            answer: ragResult.answer,
            sources: ragResult.sources,
        });
    } catch (error: any) {
        console.error("[ChatController] handleChatMessage error:", error.message);
        res.status(500).json({ message: "Error processing chat", error: error.message });
    }
};

/**
 * POST /api/chat/stream
 *
 * Server-Sent Events streaming endpoint.
 * The client receives tokens as they are generated — no waiting for the full response.
 *
 * SSE event format:
 *   data: {"sources": [...]}\n\n     ← sent immediately (before text streams)
 *   data: {"token": "word "}\n\n    ← one per LLM token
 *   data: {"done": true}\n\n        ← end of stream
 *   data: {"error": "..."}\n\n      ← on failure
 *
 * Usage (client-side EventSource / fetch):
 *   const res = await fetch('/api/chat/stream', { method:'POST', headers:{...}, body: JSON.stringify({sessionId, message}) });
 *   const reader = res.body.getReader();
 */
export const handleChatStream = async (req: Request, res: Response): Promise<void> => {
    const { sessionId, message } = req.body;
    const userId = (req as any).user._id;

    if (!sessionId || !message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ message: "sessionId and a non-empty message are required" });
        return;
    }

    // ── Set SSE headers before writing anything ──────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    // Keep connection alive with a heartbeat on the SSE channel
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 20_000);

    try {
        // ── Find or create session + build history ───────────────────────
        let chat = await Chat.findOne({ userId, sessionId });
        if (!chat) {
            chat = new Chat({ userId, sessionId, messages: [] });
        }

        const userMessage: IMessage = { role: "user", content: message.trim(), createdAt: new Date() };
        chat.messages.push(userMessage);

        const historyForRAG = chat.messages
            .slice(0, -1)
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.content }));

        // ── Stream the RAG response ──────────────────────────────────────
        const fullAnswer = await runRAGPipelineStream(
            userId.toString(),
            message.trim(),
            historyForRAG,
            res
        );

        // ── Persist the exchange ─────────────────────────────────────────
        if (fullAnswer) {
            const assistantMessage: IMessage = {
                role: "assistant",
                content: fullAnswer,
                createdAt: new Date(),
            };
            chat.messages.push(assistantMessage);
            await chat.save();
        }
    } catch (err: any) {
        console.error("[ChatController] handleChatStream error:", err.message);
        res.write(`data: ${JSON.stringify({ error: "Stream failed. Please try again." })}\n\n`);
        res.end();
    } finally {
        clearInterval(heartbeat);
    }
};

/**
 * GET /api/chat/logs
 * Protected (JWT). Returns all sessions for the logged-in user.
 */
export const getChatLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const logs = await chatService.getChatLogs(userId);
        res.status(200).json(logs);
    } catch (error: any) {
        console.error("[ChatController] getChatLogs error:", error.message);
        res.status(500).json({ message: "Error fetching chat logs", error: error.message });
    }
};

/**
 * GET /api/chat/:chatId
 * Protected (JWT). Returns the full message history for one session.
 */
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
        console.error("[ChatController] getChatById error:", error.message);
        res.status(500).json({ message: "Error fetching chat", error: error.message });
    }
};
