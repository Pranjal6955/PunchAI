import Chat, { IChat, IMessage } from "../models/Chat";
import mongoose from "mongoose";

class ChatService {
    /**
     * Handle chat message and generate response
     */
    async processMessage(userId: string, sessionId: string, messageContent: string): Promise<string> {
        // 1. Find or create chat session
        let chat = await Chat.findOne({ userId, sessionId });

        if (!chat) {
            chat = new Chat({
                userId,
                sessionId,
                messages: [],
            });
        }

        // 2. Add user message
        const userMessage: IMessage = {
            role: "user",
            content: messageContent,
            createdAt: new Date(),
        };
        chat.messages.push(userMessage);

        // 3. Generate static temp reply
        const assistantResponse = "This is a temporary AI response.";

        // 4. Add assistant message
        const assistantMessage: IMessage = {
            role: "assistant",
            content: assistantResponse,
            createdAt: new Date(),
        };
        chat.messages.push(assistantMessage);

        // 5. Save chat
        await chat.save();

        return assistantResponse;
    }

    /**
     * Get chat logs for an admin user
     */
    async getChatLogs(userId: string) {
        // Return chats for user with last message and updatedAt
        const chats = await Chat.find({ userId })
            .sort({ updatedAt: -1 })
            .select("sessionId messages updatedAt");

        return chats.map(chat => ({
            _id: chat._id,
            sessionId: chat.sessionId,
            lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null,
            updatedAt: chat.updatedAt,
        }));
    }

    /**
     * Get full conversion for a specific chat
     */
    async getChatById(chatId: string, userId: string) {
        return await Chat.findOne({ _id: chatId, userId });
    }
}

export default new ChatService();
