import Chat, { IMessage } from "../models/Chat";
import { runRAGPipeline, RAGResult } from "./ragService";

class ChatService {
    /**
     * Process an incoming user message through the RAG pipeline
     * and persist the full exchange in the Chat model.
     *
     * @returns The full RAGResult (answer + source citations)
     */
    async processMessage(
        userId: string,
        sessionId: string,
        messageContent: string
    ): Promise<RAGResult> {
        // ── 1. Find or create the chat session ──────────────────────────
        let chat = await Chat.findOne({ userId, sessionId });

        if (!chat) {
            chat = new Chat({ userId, sessionId, messages: [] });
        }

        // ── 2. Save user message immediately ────────────────────────────
        const userMessage: IMessage = {
            role: "user",
            content: messageContent,
            createdAt: new Date(),
        };
        chat.messages.push(userMessage);

        // ── 3. Build recent chat history for conversational context ─────
        //    We pass the messages that were already in the DB (before this turn)
        //    so the LLM can refer back to prior exchanges.
        const historyForRAG = chat.messages
            .slice(0, -1) // exclude the user message we just added
            .slice(-12)   // keep last 12 messages (6 turns)
            .map((m) => ({ role: m.role, content: m.content }));

        // ── 4. Run the RAG pipeline ───────────────────────────────────────
        const ragResult = await runRAGPipeline(
            userId.toString(),
            messageContent,
            historyForRAG
        );

        // ── 5. Persist assistant answer ───────────────────────────────────
        const assistantMessage: IMessage = {
            role: "assistant",
            content: ragResult.answer,
            createdAt: new Date(),
        };
        chat.messages.push(assistantMessage);

        await chat.save();

        return ragResult;
    }

    /**
     * Get all chat sessions for an admin user (dashboard view).
     */
    async getChatLogs(userId: string) {
        const chats = await Chat.find({ userId })
            .sort({ updatedAt: -1 })
            .select("sessionId messages updatedAt");

        return chats.map((chat) => ({
            _id: chat._id,
            sessionId: chat.sessionId,
            lastMessage:
                chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1]
                    : null,
            messageCount: chat.messages.length,
            updatedAt: chat.updatedAt,
        }));
    }

    /**
     * Get full conversation for a specific chat session.
     */
    async getChatById(chatId: string, userId: string) {
        return await Chat.findOne({ _id: chatId, userId });
    }
}

export default new ChatService();
