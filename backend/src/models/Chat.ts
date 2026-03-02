import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
    role: "user" | "assistant";
    content: string;
    createdAt?: Date;
}

export interface IChat extends Document {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const chatSchema = new Schema<IChat>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
        },
        messages: [messageSchema],
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
chatSchema.index({ userId: 1, sessionId: 1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
