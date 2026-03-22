/**
 * rag.service.ts — Query-time RAG Pipeline
 *
 * Orchestrates:
 *   1. Embed the user message
 *   2. Similarity-search Pinecone (always filtered by userId)
 *   3. Build a context-aware prompt
 *   4. Call the LLM (buffered or streaming)
 *   5. Return answer + source attribution
 */

import { Response } from "express";
import { generateEmbedding } from "./embeddingService";
import { searchVectors, VectorMatch } from "./vector.service";
import { generateLLMResponse, streamLLMResponse } from "./llm.service";
import { buildContextFromMatches, buildRAGPrompt } from "./prompt.builder";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface RAGSource {
    sourceType: string;
    sourceName: string;
}

export interface RAGResult {
    answer: string;
    sources: RAGSource[];
}

// ─── Fallback message ───────────────────────────────────────────────────────
const NO_CONTEXT_RESPONSE =
    "Sorry, I couldn't find relevant information to answer your question. " +
    "Please make sure the relevant data sources have been added and processed.";

// ─── Shared: embed + search ─────────────────────────────────────────────────
const embedAndSearch = async (
    userId: string,
    userMessage: string,
    topK: number
): Promise<VectorMatch[]> => {
    const queryEmbedding = await generateEmbedding(userMessage);

    try {
        return await searchVectors({ queryEmbedding, userId, topK });
    } catch (err: any) {
        console.error("[RAGService] Vector search failed:", err.message);
        return [];
    }
};

// ─── Shared: deduplicate sources ─────────────────────────────────────────────
const deduplicateSources = (matches: VectorMatch[]): RAGSource[] => {
    const seen = new Set<string>();
    const sources: RAGSource[] = [];

    for (const match of matches) {
        const key = `${match.sourceType}::${match.sourceName}`;
        if (!seen.has(key)) {
            seen.add(key);
            sources.push({ sourceType: match.sourceType, sourceName: match.sourceName });
        }
    }

    return sources;
};

// ─── Buffered RAG Pipeline ─────────────────────────────────────────────────
export const runRAGPipeline = async (
    userId: string,
    userMessage: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    topK: number = 5
): Promise<RAGResult> => {
    let queryEmbedding: number[];
    try {
        queryEmbedding = await generateEmbedding(userMessage);
    } catch (embedErr: any) {
        throw new Error(`Failed to generate query embedding: ${embedErr.message}`);
    }

    const matches = await embedAndSearch(userId, userMessage, topK);

    if (matches.length === 0) {
        return { answer: NO_CONTEXT_RESPONSE, sources: [] };
    }

    const contextText = buildContextFromMatches(matches);
    const messages = buildRAGPrompt(userMessage, contextText, chatHistory);

    let llmResponse: { text: string };
    try {
        llmResponse = await generateLLMResponse(messages);
    } catch (llmErr: any) {
        throw new Error(`LLM generation failed: ${llmErr.message}`);
    }

    return {
        answer: llmResponse.text,
        sources: deduplicateSources(matches),
    };
};

// ─── Streaming RAG Pipeline ──────────────────────────────────────────────────
/**
 * Runs the RAG pipeline and streams the LLM response via SSE.
 *
 * SSE events emitted:
 *   data: {"token": "..."}\n\n         ← token chunks
 *   data: {"sources": [...]}\n\n       ← source citations sent before done
 *   data: {"done": true}\n\n           ← end-of-stream marker
 *   data: {"error": "..."}\n\n         ← on failure
 *
 * Returns the full assembled answer string (for saving to DB).
 */
export const runRAGPipelineStream = async (
    userId: string,
    userMessage: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }>,
    res: Response,
    topK: number = 5
): Promise<string> => {
    const write = (payload: object) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

    let matches: VectorMatch[] = [];
    try {
        matches = await embedAndSearch(userId, userMessage, topK);
    } catch (err: any) {
        write({ error: "Failed to search knowledge base. Please try again." });
        res.end();
        return NO_CONTEXT_RESPONSE;
    }

    if (matches.length === 0) {
        write({ token: NO_CONTEXT_RESPONSE });
        write({ sources: [], done: true });
        res.end();
        return NO_CONTEXT_RESPONSE;
    }

    const contextText = buildContextFromMatches(matches);
    const messages = buildRAGPrompt(userMessage, contextText, chatHistory);
    const sources = deduplicateSources(matches);

    // Send sources early so the client can render citations while text streams
    write({ sources });

    try {
        const fullText = await streamLLMResponse(messages, res);
        res.end();
        return fullText;
    } catch (err: any) {
        console.error("[RAGService] Streaming LLM failed:", err.message);
        res.end();
        return "";
    }
};
