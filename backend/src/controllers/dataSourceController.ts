import { Request, Response } from "express";
import DataSource from "../models/DataSource";
import { processDataSource, removeDataSourceProcessing, reprocessProvidedText } from "../services/ragService";

// Helper for type
interface AuthRequest extends Request {
    user?: any;
}

export const getSources = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const sources = await DataSource.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(sources);
    } catch (error) {
        console.error("Error fetching data sources:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const addWebsiteSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { name, url } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!name || !url) {
            res.status(400).json({ message: "Name and URL are required" });
            return;
        }

        const newSource = new DataSource({
            userId,
            name,
            type: "website",
            sourceUrl: url,
            status: "pending",
        });

        await newSource.save();

        // Kick off async processing (fire and forget)
        processDataSource(newSource._id.toString());

        res.status(201).json(newSource);
    } catch (error) {
        console.error("Error adding website source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const uploadDocumentSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const file = req.file;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!file) {
            res.status(400).json({ message: "Document file is required" });
            return;
        }

        // We store the path and mimetype in a single field separated by ::: for later parsing
        const fileRecord = `${file.path}:::${file.mimetype}`;

        const newSource = new DataSource({
            userId,
            name: file.originalname,
            type: "document",
            fileUrl: fileRecord,
            status: "pending",
        });

        await newSource.save();

        // Kick off processing
        processDataSource(newSource._id.toString());

        res.status(201).json(newSource);
    } catch (error) {
        console.error("Error uploading document source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const addFaqSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        let { name, question, answer, faqs } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        // Support both old format (question/answer) and new format (faqs array)
        if (!faqs || faqs.length === 0) {
            if (question && answer) {
                faqs = [{ question, answer }];
            }
        }

        if (!name || !faqs || faqs.length === 0) {
            res.status(400).json({ message: "Name and at least one FAQ are required" });
            return;
        }

        // Often you might append to an existing "General FAQ" source, or create a new entry
        const newSource = new DataSource({
            userId,
            name,
            type: "faq",
            faqs: faqs,
            status: "pending",
        });

        await newSource.save();

        // Process data async
        processDataSource(newSource._id.toString());

        res.status(201).json(newSource);
    } catch (error) {
        console.error("Error adding FAQ source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateDataSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource) {
            res.status(404).json({ message: "Data source not found" });
            return;
        }

        if (name) {
            dataSource.name = name;
        }

        await dataSource.save();
        res.status(200).json(dataSource);
    } catch (error) {
        console.error("Error updating data source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateFaqSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name, faqs } = req.body; // Expects the updated array of FAQs

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource || dataSource.type !== 'faq') {
            res.status(404).json({ message: "FAQ data source not found" });
            return;
        }

        if (name) dataSource.name = name;
        if (faqs && Array.isArray(faqs)) {
            dataSource.set("faqs", faqs);
            dataSource.status = "pending";

            // Re-process: First delete old vectors, then process again.
            await removeDataSourceProcessing(dataSource._id.toString());
            await dataSource.save();
            processDataSource(dataSource._id.toString());
        } else {
            await dataSource.save();
        }

        res.status(200).json(dataSource);
    } catch (error) {
        console.error("Error updating FAQ source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateWebsiteSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name, url } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource || dataSource.type !== 'website') {
            res.status(404).json({ message: "Website data source not found" });
            return;
        }

        if (name) dataSource.name = name;
        if (url && dataSource.sourceUrl !== url) {
            dataSource.sourceUrl = url;
            dataSource.status = "pending";

            // Wipe vectors from Pinecone and re-scrape
            await removeDataSourceProcessing(dataSource._id.toString());
            await dataSource.save();
            processDataSource(dataSource._id.toString());
        } else {
            await dataSource.save();
        }

        res.status(200).json(dataSource);
    } catch (error) {
        console.error("Error updating website source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateDocumentSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name } = req.body;
        const file = req.file;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource || dataSource.type !== 'document') {
            res.status(404).json({ message: "Document data source not found" });
            return;
        }

        if (name) dataSource.name = name;

        if (file) {
            // New file has been uploaded
            const fileRecord = `${file.path}:::${file.mimetype}`;
            dataSource.fileUrl = fileRecord;
            dataSource.status = "pending";

            // Delete old vectors, reprocess new file
            await removeDataSourceProcessing(dataSource._id.toString());
            await dataSource.save();
            processDataSource(dataSource._id.toString());
        } else {
            // Only updating name or nothing
            await dataSource.save();
        }

        res.status(200).json(dataSource);
    } catch (error) {
        console.error("Error updating document source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteDataSource = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource) {
            res.status(404).json({ message: "Data source not found" });
            return;
        }

        // Attempt async clean up
        removeDataSourceProcessing(dataSource._id.toString());

        // We delete from Mongo. (Could also just mark it deleted if preferred)
        await DataSource.deleteOne({ _id: id });

        res.status(200).json({ message: "Data source deleted" });
    } catch (error) {
        console.error("Error deleting data source:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateDataSourceText = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { extractedText } = req.body;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource) {
            res.status(404).json({ message: "Data source not found" });
            return;
        }

        if (dataSource.extractedText !== extractedText) {
            dataSource.extractedText = extractedText;
            dataSource.status = "pending";
            await dataSource.save();

            reprocessProvidedText(dataSource._id.toString(), extractedText);
        }

        res.status(200).json(dataSource);
    } catch (error) {
        console.error("Error updating data source text:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const dataSource = await DataSource.findOne({ _id: id, userId });
        if (!dataSource || dataSource.type !== "document" || !dataSource.fileUrl) {
            res.status(404).json({ message: "Data source document not found" });
            return;
        }

        const [path, mimetype] = dataSource.fileUrl.split(":::");

        res.setHeader("Content-Type", mimetype || "application/octet-stream");
        res.download(path, dataSource.name, (err) => {
            if (err) {
                console.error("File download error:", err);
                if (!res.headersSent) {
                    res.status(404).json({ message: "File not found on server" });
                }
            }
        });
    } catch (error) {
        console.error("Error downloading document:", error);
        res.status(500).json({ message: "Server error" });
    }
};
