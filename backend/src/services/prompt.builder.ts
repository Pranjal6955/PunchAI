import { VectorMatch } from "./vector.service";
import { LLMMessage } from "./llm.service";

// ─── Constants ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI customer support assistant.

Rules:
- Answer ONLY using the provided context below.
- If the context does not contain enough information to answer the question, respond with: "I'm sorry, I don't have enough information to answer that question."
- Do NOT hallucinate, speculate, or use knowledge outside the provided context.
- Be concise, professional, and helpful.
- If appropriate, use bullet points or short paragraphs for clarity.`;

// ─── Helpers ───────────────────────────────────────────────────────────────
/**
 * Deduplicate and assemble matched vector chunks into a single context string.
 * Each chunk is labelled with its source for transparency.
 */
export const buildContextFromMatches = (matches: VectorMatch[]): string => {
    if (matches.length === 0) return "";

    // Deduplicate by chunkText (same chunk can come from overlapping windows)
    const seen = new Set<string>();
    const uniqueMatches = matches.filter((m) => {
        if (seen.has(m.chunkText)) return false;
        seen.add(m.chunkText);
        return true;
    });

    return uniqueMatches
        .map((m, i) => {
            const label = `[Source ${i + 1}: ${m.sourceName} (${m.sourceType})]`;
            return `${label}\n${m.chunkText.trim()}`;
        })
        .join("\n\n---\n\n");
};

// ─── Prompt Builder ────────────────────────────────────────────────────────
/**
 * Constructs the full message array for the LLM.
 *
 * @param userMessage   The raw user question.
 * @param contextText   Assembled context from vector search.
 * @param chatHistory   Previous messages in the session (max last 6).
 */
export const buildRAGPrompt = (
    userMessage: string,
    contextText: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): LLMMessage[] => {
    const messages: LLMMessage[] = [];

    // 1. System instruction
    messages.push({ role: "system", content: SYSTEM_PROMPT });

    // 2. Inject context as a system message so it has high precedence
    if (contextText) {
        messages.push({
            role: "system",
            content: `Here is the relevant context to use when answering:\n\n${contextText}`,
        });
    }

    // 3. Append recent chat history for conversational continuity (last 6 turns)
    const recentHistory = chatHistory.slice(-6);
    for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
    }

    // 4. Current user question
    messages.push({ role: "user", content: userMessage });

    return messages;
};
