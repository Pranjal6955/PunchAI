import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Expected embedding dimension — MUST match the Pinecone index configuration.
 * OpenAI text-embedding-3-small: 1024 (via `dimensions` param).
 * Gemini embedding-001: 3072 → truncated to 1024.
 * If you change the index dimension, update this constant.
 */
const EXPECTED_DIMENSION = 1024;

const validateDimension = (embedding: number[], provider: string): void => {
    if (embedding.length !== EXPECTED_DIMENSION) {
        throw new Error(
            `[EmbeddingService] ${provider} returned ${embedding.length} dims ` +
            `but Pinecone index expects ${EXPECTED_DIMENSION}. ` +
            `Update EXPECTED_DIMENSION or reconfigure the index.`
        );
    }
};

/**
 * Generate embeddings using OpenAI as primary, falling back to Gemini.
 * Validates dimensions after every call to catch index mismatches early.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        if (!openai) throw new Error("OpenAI API key missing");

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            dimensions: EXPECTED_DIMENSION,
        });

        const embedding = response.data[0].embedding;
        validateDimension(embedding, "OpenAI text-embedding-3-small");
        return embedding;
    } catch (openaiError: any) {
        console.warn(`OpenAI Embedding failed (${openaiError.message}). Falling back to Gemini...`);

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key missing");

            const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const result = await model.embedContent(text);

            // Gemini returns 3072 dims — truncate to match the Pinecone index
            const embedding = result.embedding.values.slice(0, EXPECTED_DIMENSION);
            validateDimension(embedding, "Gemini gemini-embedding-001 (truncated)");
            return embedding;
        } catch (geminiError: any) {
            console.error(`Gemini Embedding fallback also failed: ${geminiError.message}`);
            throw new Error("Failed to generate embeddings from both Primary and Backup services.");
        }
    }
};

/**
 * Utility function to split large text into chunks
 */
export const chunkText = (text: string, maxTokens: number = 1000): string[] => {
    // Simple word-based chunking for demonstration
    // Note: A more robust approach would use a tokenizer specific to the model, like tiktoken
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const word of words) {
        if (currentWordCount + 1 > maxTokens) {
            chunks.push(currentChunk.join(" "));
            // Overlapping chunks for better contextual continuity
            const overlap = currentChunk.slice(-Math.floor(maxTokens * 0.1));
            currentChunk = [...overlap, word];
            currentWordCount = overlap.length + 1;
        } else {
            currentChunk.push(word);
            currentWordCount += 1;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }

    return chunks;
};
