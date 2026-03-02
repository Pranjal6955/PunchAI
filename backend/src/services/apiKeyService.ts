import crypto from "crypto";
import User from "../models/User";

class ApiKeyService {
    /**
     * Generate a secure random API key
     */
    generateKey(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    /**
     * Update or create a user's API key
     */
    async updateUserApiKey(userId: string): Promise<string> {
        const newApiKey = this.generateKey();

        const user = await User.findByIdAndUpdate(
            userId,
            { apiKey: newApiKey },
            { new: true }
        );

        if (!user) {
            throw new Error("User not found");
        }

        return newApiKey;
    }
}

export default new ApiKeyService();
