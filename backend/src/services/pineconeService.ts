import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

let pinecone: Pinecone | null = null;
let pineconeIndex: any = null;

try {
    if (process.env.PINECONE_API_KEY) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        // Use an environment variable for the index name or default
        pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME || "punchai-index");
    } else {
        console.warn("PINECONE_API_KEY is not defined. Vector DB features will fail.");
    }
} catch (error) {
    console.error("Error initializing Pinecone:", error);
}

export type VectorData = {
    id: string; // usually chunk ID or unique ID
    values: number[]; // embedding array
    metadata: {
        dataSourceId: string;
        userId: string;
        sourceType: string;
        text: string;
        [key: string]: any;
    };
};

/**
 * Upsert vectors into Pinecone
 */
export const upsertVectors = async (vectors: VectorData[]): Promise<void> => {
    if (!pineconeIndex) throw new Error("Pinecone index is not initialized");

    // Upsert expects a maximum of 1000 vectors at once depending on metadata size
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await pineconeIndex.upsert({ records: batch });
    }
};

/**
 * Delete vectors for a specific data source
 * Usually requires metadata filtering if the ID isn't simple, 
 * however Pinecone supports deleting by ID list if IDs are formatted properly
 */
export const deleteVectorsByDataSource = async (dataSourceId: string): Promise<void> => {
    if (!pineconeIndex) throw new Error("Pinecone index is not initialized");

    // Assuming we prefix vector IDs with `ds_${dataSourceId}_`
    // Alternatively you could use metadata filtering but it's often simpler to fetch and delete
    // For now we will delete by prefix or fetch
    // Workaround: We might need to handle this by filtering if prefix is not supported
    // But pinecone delete with filter:
    try {
        await pineconeIndex.deleteMany({ dataSourceId: dataSourceId });
    } catch (e) {
        console.error("Failed to delete vectors. Ensure index has metadata filtering enabled for dataSourceId");
    }
};
