import crypto from "crypto";
import User from "../models/User";

export type ApiKeyType = "primary" | "fallback";

class ApiKeyService {
    /** Generate a cryptographically secure raw API key. */
    generateRawKey(): string {
        return `pak_${crypto.randomBytes(32).toString("hex")}`;
    }

    /** Compute the SHA-256 hash to store in the DB. */
    hashKey(rawKey: string): string {
        return crypto.createHash("sha256").update(rawKey).digest("hex");
    }

    /** Timing-safe comparison of a raw key against a stored hash. */
    verifyKey(rawKey: string, storedHash: string): boolean {
        const incomingHash = this.hashKey(rawKey);
        try {
            return crypto.timingSafeEqual(
                Buffer.from(incomingHash, "hex"),
                Buffer.from(storedHash, "hex")
            );
        } catch {
            return false;
        }
    }

    /** Generate a key pair — caller stores hash, shows raw once. */
    generateKeyPair(): { rawKey: string; keyHash: string } {
        const rawKey = this.generateRawKey();
        return { rawKey, keyHash: this.hashKey(rawKey) };
    }

    /**
     * Rotate a specific key (primary or fallback).
     * Stores the hash in DB and returns the raw key ONCE.
     */
    async rotateKey(userId: string, type: ApiKeyType): Promise<string> {
        const rawKey = this.generateRawKey();
        const keyHash = this.hashKey(rawKey);
        const now = new Date();

        let update: Record<string, any>;

        if (type === "primary") {
            update = {
                primaryApiKeyHash: keyHash,
                primaryApiKeyCreatedAt: now,
                // Clear legacy fields when rotating primary
                $unset: { apiKey: "", apiKeyHash: "" },
            };
        } else {
            update = {
                fallbackApiKeyHash: keyHash,
                fallbackApiKeyCreatedAt: now,
            };
        }

        const user = await User.findByIdAndUpdate(userId, update, { returnDocument: "after" });
        if (!user) throw new Error("User not found");

        return rawKey;
    }

    /**
     * Revoke (delete) the fallback key entirely.
     * Call this after you've fully migrated to the new primary key.
     */
    async revokeFallbackKey(userId: string): Promise<void> {
        const user = await User.findByIdAndUpdate(
            userId,
            { $unset: { fallbackApiKeyHash: "", fallbackApiKeyCreatedAt: "" } },
            { returnDocument: "after" }
        );
        if (!user) throw new Error("User not found");
    }

    /**
     * Get key metadata (no raw keys — never stored).
     * Only checks the new primaryApiKeyHash / fallbackApiKeyHash fields.
     * Legacy keys (apiKey, apiKeyHash) are intentionally ignored so users
     * always start fresh and generate keys explicitly from the dashboard.
     */
    async getKeyStatus(userId: string): Promise<{
        primary: { active: boolean; createdAt: Date | null };
        fallback: { active: boolean; createdAt: Date | null };
    }> {
        const user = await User.findById(userId).select(
            "primaryApiKeyHash primaryApiKeyCreatedAt fallbackApiKeyHash fallbackApiKeyCreatedAt"
        );
        if (!user) throw new Error("User not found");

        const u = user as any;
        return {
            primary: {
                active: !!u.primaryApiKeyHash,
                createdAt: u.primaryApiKeyCreatedAt ?? null,
            },
            fallback: {
                active: !!u.fallbackApiKeyHash,
                createdAt: u.fallbackApiKeyCreatedAt ?? null,
            },
        };
    }

    // ── Legacy compat ───────────────────────────────────────────────────────
    /** @deprecated Use rotateKey(userId, "primary") */
    async rotateApiKey(userId: string): Promise<string> {
        return this.rotateKey(userId, "primary");
    }

    /** @deprecated Use rotateKey(userId, "primary") */
    async updateUserApiKey(userId: string): Promise<string> {
        return this.rotateKey(userId, "primary");
    }
}

export default new ApiKeyService();
