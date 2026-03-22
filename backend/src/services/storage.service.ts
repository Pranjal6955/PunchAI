/**
 * storage.service.ts
 *
 * Cloud-provider-agnostic file storage abstraction.
 *
 * Current Implementation: Local filesystem
 * To switch to S3: set STORAGE_PROVIDER=s3 and configure AWS_* env vars.
 *   Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *   Then uncomment the S3 section below.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// ─── Types ─────────────────────────────────────────────────────────────────
export interface StoredFile {
    /** Opaque reference stored in DB (local path or S3 key) */
    storageKey: string;
    /** Public-facing URL or relative path for serving */
    url: string;
    /** Original MIME type */
    mimeType: string;
    /** Size in bytes */
    sizeBytes: number;
}

export interface StorageProvider {
    save(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        folder?: string
    ): Promise<StoredFile>;
    delete(storageKey: string): Promise<void>;
    getBuffer(storageKey: string): Promise<Buffer>;
    getAbsolutePath(storageKey: string): string;
}

// ─── Local Filesystem Provider ─────────────────────────────────────────────
class LocalStorageProvider implements StorageProvider {
    private baseDir: string;

    constructor() {
        this.baseDir = path.join(__dirname, "../../uploads");
        this.ensureDir(this.baseDir);
    }

    private ensureDir(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async save(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        folder: string = "documents"
    ): Promise<StoredFile> {
        const dir = path.join(this.baseDir, folder);
        this.ensureDir(dir);

        // Deterministic unique name: timestamp + random + original extension
        const ext = path.extname(originalName) || "";
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        const filePath = path.join(dir, uniqueName);

        await fs.promises.writeFile(filePath, buffer);

        // storageKey is the relative path from the uploads dir (for portability)
        const storageKey = path.join(folder, uniqueName);

        return {
            storageKey,
            url: `/uploads/${storageKey}`,
            mimeType,
            sizeBytes: buffer.byteLength,
        };
    }

    async delete(storageKey: string): Promise<void> {
        const fullPath = path.join(this.baseDir, storageKey);
        try {
            if (fs.existsSync(fullPath)) {
                await fs.promises.unlink(fullPath);
            }
        } catch (err) {
            console.warn(`[StorageService] Could not delete file ${fullPath}:`, err);
        }
    }

    async getBuffer(storageKey: string): Promise<Buffer> {
        const fullPath = path.join(this.baseDir, storageKey);
        return fs.promises.readFile(fullPath);
    }

    getAbsolutePath(storageKey: string): string {
        return path.join(this.baseDir, storageKey);
    }
}

// ─── S3 Provider Stub ───────────────────────────────────────────────────────
// Uncomment and fill in when switching to S3.
//
// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
//
// class S3StorageProvider implements StorageProvider {
//     private client: S3Client;
//     private bucket: string;
//
//     constructor() {
//         this.client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
//         this.bucket = process.env.AWS_S3_BUCKET!;
//     }
//
//     async save(buffer: Buffer, originalName: string, mimeType: string, folder = "documents"): Promise<StoredFile> {
//         const ext = path.extname(originalName);
//         const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
//         await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }));
//         return { storageKey: key, url: `https://${this.bucket}.s3.amazonaws.com/${key}`, mimeType, sizeBytes: buffer.byteLength };
//     }
//
//     async delete(storageKey: string): Promise<void> {
//         await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
//     }
//
//     async getBuffer(storageKey: string): Promise<Buffer> {
//         const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
//         // Convert ReadableStream to Buffer
//         const chunks: Uint8Array[] = [];
//         for await (const chunk of res.Body as any) chunks.push(chunk);
//         return Buffer.concat(chunks);
//     }
//
//     getAbsolutePath(_storageKey: string): string { throw new Error("S3 provider has no local path"); }
// }

// ─── Factory: pick provider from STORAGE_PROVIDER env var ─────────────────
const createStorageProvider = (): StorageProvider => {
    const provider = process.env.STORAGE_PROVIDER || "local";

    switch (provider) {
        case "s3":
            // return new S3StorageProvider();
            throw new Error(
                "[StorageService] S3 provider requested but not yet configured. " +
                "Install @aws-sdk/client-s3 and uncomment the S3 section in storage.service.ts"
            );

        case "local":
        default:
            return new LocalStorageProvider();
    }
};

// ─── Singleton export ───────────────────────────────────────────────────────
const storageService: StorageProvider = createStorageProvider();
export default storageService;
