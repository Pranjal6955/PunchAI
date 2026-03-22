import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Response } from "express";
import dotenv from "dotenv";

dotenv.config();

// ─── Clients ───────────────────────────────────────────────────────────────
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface LLMMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface LLMResponse {
    text: string;
    model: string;
    provider: "openai" | "gemini";
}

// ─── Standard (non-streaming) calls ────────────────────────────────────────
const callOpenAI = async (messages: LLMMessage[]): Promise<LLMResponse> => {
    if (!openai) throw new Error("[LLMService] OpenAI API key is not configured.");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return { text, model: "gpt-4o-mini", provider: "openai" };
};

const callGemini = async (messages: LLMMessage[]): Promise<LLMResponse> => {
    if (!genAI) throw new Error("[LLMService] Gemini API key is not configured.");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    const prompt = messages
        .map((m) => {
            if (m.role === "system") return `[SYSTEM]\n${m.content}`;
            if (m.role === "user") return `[USER]\n${m.content}`;
            return `[ASSISTANT]\n${m.content}`;
        })
        .join("\n\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return { text, model: "gemini-1.5-flash", provider: "gemini" };
};

/**
 * Standard (buffered) response.
 * OpenAI is primary; falls back to Gemini.
 */
export const generateLLMResponse = async (
    messages: LLMMessage[]
): Promise<LLMResponse> => {
    if (openai) {
        try {
            return await callOpenAI(messages);
        } catch (err: any) {
            console.warn(`[LLMService] OpenAI failed (${err.message}). Falling back to Gemini…`);
        }
    }

    if (genAI) {
        try {
            return await callGemini(messages);
        } catch (err: any) {
            throw new Error(`[LLMService] Both providers failed. Last: ${err.message}`);
        }
    }

    throw new Error("[LLMService] No LLM provider configured.");
};

// ─── Streaming ─────────────────────────────────────────────────────────────
/**
 * Server-Sent Events streaming response.
 *
 * The caller must have already set the SSE headers on `res`.
 * This function writes SSE events and closes the stream.
 *
 * Event format:
 *   data: {"token": "..."}\n\n        ← token chunk
 *   data: {"done": true}\n\n          ← end-of-stream marker
 *
 * Returns the full assembled text (for saving to DB).
 */
export const streamLLMResponse = async (
    messages: LLMMessage[],
    res: Response
): Promise<string> => {
    const write = (payload: object) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // ── Try OpenAI streaming first ─────────────────────────────────────
    if (openai) {
        try {
            const stream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                temperature: 0.3,
                max_tokens: 1024,
                stream: true,
            });

            let fullText = "";
            for await (const chunk of stream) {
                const token = chunk.choices[0]?.delta?.content ?? "";
                if (token) {
                    fullText += token;
                    write({ token });
                }
            }

            write({ done: true });
            return fullText;
        } catch (err: any) {
            console.warn(`[LLMService] OpenAI stream failed (${err.message}). Falling back to Gemini…`);
        }
    }

    // ── Gemini streaming fallback ──────────────────────────────────────
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            });

            const prompt = messages
                .map((m) => {
                    if (m.role === "system") return `[SYSTEM]\n${m.content}`;
                    if (m.role === "user") return `[USER]\n${m.content}`;
                    return `[ASSISTANT]\n${m.content}`;
                })
                .join("\n\n");

            const result = await model.generateContentStream(prompt);

            let fullText = "";
            for await (const chunk of result.stream) {
                const token = chunk.text();
                if (token) {
                    fullText += token;
                    write({ token });
                }
            }

            write({ done: true });
            return fullText;
        } catch (err: any) {
            // Signal error to the client via SSE before throwing
            write({ error: "LLM generation failed. Please try again." });
            throw new Error(`[LLMService] Gemini stream also failed: ${err.message}`);
        }
    }

    write({ error: "No LLM provider available." });
    throw new Error("[LLMService] No LLM provider configured.");
};
