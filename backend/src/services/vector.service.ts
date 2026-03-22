import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

// ─── Pinecone singleton ────────────────────────────────────────────────────
let pineconeIndex: ReturnType<Pinecone["index"]> | null = null;

try {
    if (process.env.PINECONE_API_KEY) {
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        pineconeIndex = pinecone.index(
            process.env.PINECONE_INDEX_NAME || "punchai-index"
        );
    } else {
        console.warn("[VectorService] PINECONE_API_KEY not set — vector search disabled.");
    }
} catch (err) {
    console.error("[VectorService] Failed to initialize Pinecone:", err);
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface VectorMatch {
    id: string;
    score: number;
    chunkText: string;
    sourceType: string;
    sourceName: string;
    dataSourceId: string;
}

export interface VectorSearchOptions {
    /** The pre-computed query embedding */
    queryEmbedding: number[];
    /** Owner of the data — MANDATORY filter */
    userId: string;
    /** Number of top results to return (default 5) */
    topK?: number;
    /** Optionally restrict to a specific source type */
    sourceType?: "website" | "document" | "faq";
}

// ─── Core search function ──────────────────────────────────────────────────
/**
 * Runs a similarity search in Pinecone, always filtered by `userId`.
 * Returns the matched chunks with their metadata.
 */
export const searchVectors = async (
    options: VectorSearchOptions
): Promise<VectorMatch[]> => {
    if (!pineconeIndex) {
        throw new Error("[VectorService] Pinecone index is not initialized.");
    }

    const { queryEmbedding, userId, topK = 5, sourceType } = options;

    // Build metadata filter — userId is always required
    const filter: Record<string, any> = { userId };
    if (sourceType) {
        filter.sourceType = sourceType;
    }

    const queryResponse = await pineconeIndex.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter,
    });

    const matches: VectorMatch[] = [];

    for (const match of queryResponse.matches || []) {
        const metadata = (match.metadata as Record<string, any>) || {};

        // Skip low-relevance results (threshold: 0.3)
        if ((match.score ?? 0) < 0.3) continue;

        matches.push({
            id: match.id,
            score: match.score ?? 0,
            chunkText: metadata.text ?? "",
            sourceType: metadata.sourceType ?? "unknown",
            sourceName: metadata.sourceName ?? metadata.dataSourceId ?? "unknown",
            dataSourceId: metadata.dataSourceId ?? "",
        });
    }

    return matches;
};
