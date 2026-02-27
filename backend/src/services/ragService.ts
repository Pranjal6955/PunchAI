import { scrapeWebsite } from "./puppeteerService";
import { extractTextFromFile } from "./documentService";
import { generateEmbedding, chunkText } from "./embeddingService";
import { upsertVectors, deleteVectorsByDataSource, VectorData } from "./pineconeService";
import DataSource from "../models/DataSource";
import { v4 as uuidv4 } from "uuid";

/**
 * Main process pipeline for DataSource items
 */
export const processDataSource = async (dataSourceId: string) => {
    try {
        const dataSource = await DataSource.findById(dataSourceId);
        if (!dataSource) throw new Error("DataSource not found");

        dataSource.status = "processing";
        await dataSource.save();

        let extractedText = "";

        if (dataSource.type === "website" && dataSource.sourceUrl) {
            extractedText = await scrapeWebsite(dataSource.sourceUrl);
        } else if (dataSource.type === "document" && dataSource.fileUrl) {
            // Assume fileUrl contains path + ':::' + mimetype for demo or we store it elsewhere
            const [path, mimetype] = dataSource.fileUrl.split(":::");
            extractedText = await extractTextFromFile(path, mimetype || "text/plain");
        } else if (dataSource.type === "faq" && dataSource.faqs && dataSource.faqs.length > 0) {
            // FAQ array combining
            extractedText = dataSource.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
        } else {
            throw new Error("Invalid DataSource type or missing required fields");
        }

        if (!extractedText || extractedText.trim() === "") {
            throw new Error("No text content could be extracted from the source");
        }

        const chunks = chunkText(extractedText, 500); // 500 maxTokens approx chunks
        const vectors: VectorData[] = [];

        // In a real app with rate limits, we should sleep or batch intelligently
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);
            vectors.push({
                id: `ds_${dataSource._id.toString()}_${uuidv4()}`,
                values: embedding,
                metadata: {
                    dataSourceId: dataSource._id.toString(),
                    userId: dataSource.userId.toString(),
                    sourceType: dataSource.type,
                    text: chunk,
                },
            });
        }

        await upsertVectors(vectors);

        dataSource.status = "completed";
        dataSource.vectorCount = vectors.length;
        dataSource.errorMessage = undefined;
        await dataSource.save();
    } catch (error: any) {
        console.error(`Error processing data source ${dataSourceId}:`, error);

        try {
            const dataSource = await DataSource.findById(dataSourceId);
            if (dataSource) {
                dataSource.status = "failed";
                dataSource.errorMessage = error.message.slice(0, 1000);
                await dataSource.save();
            }
        } catch (dbError) {
            console.error("Critical failure writing status to DB", dbError);
        }
    }
};

/**
 * Async removal of an existing datasource and its vectors
 */
export const removeDataSourceProcessing = async (dataSourceId: string) => {
    try {
        await deleteVectorsByDataSource(dataSourceId);
    } catch (error) {
        console.error(`Error removing data source vectors for ${dataSourceId}`, error);
    }
};
