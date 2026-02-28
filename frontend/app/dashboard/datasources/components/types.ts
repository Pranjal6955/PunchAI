export type SourceType = "website" | "document" | "faq";
export type SourceStatus = "pending" | "processing" | "completed" | "failed";

export interface FAQ {
    question: string;
    answer: string;
}

export interface DataSource {
    _id: string;
    name: string;
    type: SourceType;
    status: SourceStatus;
    vectorCount: number;
    sourceUrl?: string;
    fileUrl?: string;
    faqs?: FAQ[];
    errorMessage?: string;
    extractedText?: string;
    createdAt: string;
    updatedAt: string;
}

export type WebsiteFormData = {
    name: string;
    url: string;
};

export type DocumentFormData = {
    name: string;
};

export type FaqFormData = {
    question: string;
    answer: string;
};

export type AddDataSourceFormData = {
    name: string;
    url: string;
    question: string;
    answer: string;
    faqs: FAQ[];
};
