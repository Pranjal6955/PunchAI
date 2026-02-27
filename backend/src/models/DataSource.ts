import mongoose from "mongoose";

const dataSourceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["website", "document", "faq"],
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        sourceUrl: {
            // Used for website sources
            type: String,
        },
        fileUrl: {
            // Used for uploaded documents (could be cloud storage URL or local path)
            type: String,
        },
        faqs: [
            {
                question: String,
                answer: String,
            },
        ],
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        vectorCount: {
            type: Number,
            default: 0,
        },
        errorMessage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const DataSource = mongoose.model("DataSource", dataSourceSchema);

export default DataSource;
