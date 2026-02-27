import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generate embeddings using OpenAI as primary, falling back to Gemini
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        if (!openai) throw new Error("OpenAI API key missing");

        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        return response.data[0].embedding;
    } catch (openaiError: any) {
        console.warn(`OpenAI Embedding failed (${openaiError.message}). Falling back to Gemini...`);

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key missing");

            const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const result = await model.embedContent(text);

            return result.embedding.values;
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
