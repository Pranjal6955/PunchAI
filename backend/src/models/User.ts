import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },
        onboarding: {
            businessName: { type: String },
            industry: { type: String },
            websiteUrl: { type: String },
            chatbotTone: { type: String },
            languages: { type: [String] },
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
