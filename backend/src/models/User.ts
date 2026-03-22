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

        // ── Legacy (migration only) ────────────────────────────────────────
        /** @deprecated Use primaryApiKeyHash instead. */
        apiKey: { type: String, unique: true, sparse: true },
        /** @deprecated Use primaryApiKeyHash instead. */
        apiKeyHash: { type: String, unique: true, sparse: true },

        // ── Primary API Key ────────────────────────────────────────────────
        // The "live" key embedded in production chat widgets.
        primaryApiKeyHash: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        primaryApiKeyCreatedAt: {
            type: Date,
        },

        // ── Fallback API Key ───────────────────────────────────────────────
        // Used during key rotation: deploy the fallback key first, then
        // rotate the primary, then revoke the fallback.
        fallbackApiKeyHash: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        fallbackApiKeyCreatedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
