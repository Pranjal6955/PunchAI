import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
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
        profileImage: {
            type: String,
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },
        companyName: {
            type: String,
        },
        industry: {
            type: String,
        },
        websiteUrl: {
            type: String,
        },
        chatbotPersonality: {
            type: String,
        },
        chatbotPurpose: {
            type: [String],
        },
        supportedLanguages: {
            type: [String],
        },
        knowledgeBaseSetup: {
            type: String,
        },
        onboardingStep: {
            type: Number,
            default: 1,
        },
        apiKey: {
            type: String,
            unique: true,
            sparse: true,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
