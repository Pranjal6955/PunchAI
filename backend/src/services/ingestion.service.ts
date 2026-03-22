/**
 * ingestion.service.ts
 *
 * Handles the data ingestion pipeline:
 *   Extract text → Chunk → Embed → Upsert into Pinecone
 *
 * Previously this logic lived in rag.service.ts.
 * It has been moved here so that rag.service.ts can focus on
 * the query-time RAG pipeline (search → prompt → LLM).
 */

import { scrapeWebsite } from "./puppeteerService";
import { extractTextFromFile } from "./documentService";
import { generateEmbedding, chunkText } from "./embeddingService";
import { upsertVectors, deleteVectorsByDataSource, VectorData } from "./pineconeService";
import DataSource from "../models/DataSource";
import { v4 as uuidv4 } from "uuid";

// ─── Process a DataSource into vectors ─────────────────────────────────────
export const processDataSource = async (dataSourceId: string): Promise<void> => {
    try {
        const dataSource = await DataSource.findById(dataSourceId);
        if (!dataSource) throw new Error("DataSource not found");

        dataSource.status = "processing";
        await dataSource.save();

        let extractedText = "";

        if (dataSource.type === "website" && dataSource.sourceUrl) {
            extractedText = await scrapeWebsite(dataSource.sourceUrl);
        } else if (dataSource.type === "document" && dataSource.fileUrl) {
            const [path, mimetype] = dataSource.fileUrl.split(":::");
            extractedText = await extractTextFromFile(path, mimetype || "text/plain");
        } else if (dataSource.type === "faq" && dataSource.faqs && dataSource.faqs.length > 0) {
            extractedText = dataSource.faqs
                .map((f) => `Q: ${f.question ?? ""}\nA: ${f.answer ?? ""}`)
                .join("\n\n");
        } else {
            throw new Error("Invalid DataSource type or missing required fields");
        }

        if (!extractedText || extractedText.trim() === "") {
            throw new Error("No text content could be extracted from the source");
        }

        const chunks = chunkText(extractedText, 500);
        const vectors: VectorData[] = [];

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            vectors.push({
                id: `ds_${dataSource._id.toString()}_${uuidv4()}`,
                values: embedding,
                metadata: {
                    dataSourceId: dataSource._id.toString(),
                    userId: dataSource.userId.toString(),
                    sourceType: dataSource.type,
                    sourceName: dataSource.name,
                    text: chunk,
                },
            });
        }

        await upsertVectors(vectors);

        dataSource.status = "completed";
        dataSource.vectorCount = vectors.length;
        dataSource.errorMessage = undefined;
        dataSource.extractedText = extractedText;
        await dataSource.save();
    } catch (error: any) {
        console.error(`[IngestionService] Error processing DataSource ${dataSourceId}:`, error);
        try {
            const ds = await DataSource.findById(dataSourceId);
            if (ds) {
                ds.status = "failed";
                ds.errorMessage = error.message.slice(0, 1000);
                await ds.save();
            }
        } catch (dbErr) {
            console.error("[IngestionService] Critical failure updating status in DB:", dbErr);
        }
    }
};

// ─── Re-process with user-provided text ────────────────────────────────────
export const reprocessProvidedText = async (
    dataSourceId: string,
    customText: string
): Promise<void> => {
    try {
        const dataSource = await DataSource.findById(dataSourceId);
        if (!dataSource) throw new Error("DataSource not found");

        dataSource.status = "processing";
        await dataSource.save();

        if (!customText || customText.trim() === "") {
            throw new Error("No text content provided to process");
        }

        await deleteVectorsByDataSource(dataSourceId);

        const chunks = chunkText(customText, 500);
        const vectors: VectorData[] = [];

        for (const chunk of chunks) {
            const embedding = await generateEmbedding(chunk);
            vectors.push({
                id: `ds_${dataSource._id.toString()}_${uuidv4()}`,
                values: embedding,
                metadata: {
                    dataSourceId: dataSource._id.toString(),
                    userId: dataSource.userId.toString(),
                    sourceType: dataSource.type,
                    sourceName: dataSource.name,
                    text: chunk,
                },
            });
        }

        await upsertVectors(vectors);

        dataSource.status = "completed";
        dataSource.vectorCount = vectors.length;
        dataSource.errorMessage = undefined;
        dataSource.extractedText = customText;
        await dataSource.save();
    } catch (error: any) {
        console.error(`[IngestionService] Error reprocessing text for ${dataSourceId}:`, error);
        try {
            const ds = await DataSource.findById(dataSourceId);
            if (ds) {
                ds.status = "failed";
                ds.errorMessage = error.message.slice(0, 1000);
                await ds.save();
            }
        } catch (dbErr) {
            console.error("[IngestionService] Critical failure updating status in DB:", dbErr);
        }
    }
};

// ─── Remove a DataSource's vectors ─────────────────────────────────────────
export const removeDataSourceProcessing = async (dataSourceId: string): Promise<void> => {
    try {
        await deleteVectorsByDataSource(dataSourceId);
    } catch (error) {
        console.error(`[IngestionService] Error removing vectors for ${dataSourceId}:`, error);
    }
};
