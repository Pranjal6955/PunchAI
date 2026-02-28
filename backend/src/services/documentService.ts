import fs from "fs";
import { PDFParse } from "pdf-parse";

/**
 * Extracts text content from local document files.
 */
export const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
    try {
        if (mimetype === "application/pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: dataBuffer });
            const data = await parser.getText();
            await parser.destroy();
            return data.text.replace(/\n\s*\n/g, "\n").trim();
        } else if (mimetype === "text/plain") {
            return fs.readFileSync(filePath, "utf-8").trim();
        } else {
            // For future expansion (DOC, DOCX), but for now throw error
            throw new Error(`Unsupported document type: ${mimetype}. Only plaintext and PDFs are supported right now.`);
        }
    } catch (error: any) {
        console.error(`Failed to parse file ${filePath}:`, error.message);
        throw new Error(`Document parsing failed: ${error.message}`);
    }
};
