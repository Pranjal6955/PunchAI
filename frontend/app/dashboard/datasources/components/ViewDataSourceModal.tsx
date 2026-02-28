import { format } from "date-fns";
import {
    Globe,
    FileText,
    MessageCircleQuestion,
    AlertCircle,
    RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { DataSource } from "./types";
import { getStatusBadge, getTypeIcon } from "./utils";

interface ViewDataSourceModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selectedSource: DataSource | null;
    extractedTextState: string;
    setExtractedTextState: (text: string) => void;
    handleSaveText: () => void;
    isSavingText: boolean;
}

export function ViewDataSourceModal({
    isOpen,
    setIsOpen,
    selectedSource,
    extractedTextState,
    setExtractedTextState,
    handleSaveText,
    isSavingText
}: ViewDataSourceModalProps) {
    const handleDownloadDocument = async () => {
        if (!selectedSource) return;
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

            const response = await fetch(`${apiUrl}/datasources/${selectedSource._id}/download`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.error("Failed to download document");
                alert("Failed to download document. It might have been deleted from the server.");
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const [, mimetype] = selectedSource.fileUrl?.split(":::") || ["", ""];
            let extension = mimetype ? mimetype.split("/")[1] : "pdf";
            if (extension === "plain") extension = "txt";
            if (extension === "vnd.openxmlformats-officedocument.wordprocessingml.document") extension = "docx";

            a.download = `${selectedSource.name}.${extension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading document:", error);
            alert("Error downloading document");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] bg-background text-foreground border-border max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Data Source Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Viewing details for {selectedSource?.name}
                    </DialogDescription>
                </DialogHeader>

                {selectedSource && (
                    <div className="space-y-4 mt-4 text-sm">
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Name</p>
                                <p className="font-semibold">{selectedSource.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Type</p>
                                <div className="flex items-center capitalize">
                                    {getTypeIcon(selectedSource.type)}
                                    <span className="ml-2">{selectedSource.type}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Status</p>
                                <div>{getStatusBadge(selectedSource.status)}</div>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Vector Count</p>
                                <p>{selectedSource.vectorCount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Added On</p>
                                <p>{format(new Date(selectedSource.createdAt), "PPP p")}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium mb-1">Last Updated</p>
                                <p>{format(new Date(selectedSource.updatedAt), "PPP p")}</p>
                            </div>
                        </div>

                        {selectedSource.type === "website" && selectedSource.sourceUrl && (
                            <div className="mt-4 p-4 border border-border rounded-lg space-y-3">
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center">
                                        <Globe className="w-4 h-4 mr-2 text-blue-500" />
                                        Website URL
                                    </h4>
                                    <a href={selectedSource.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">
                                        {selectedSource.sourceUrl}
                                    </a>
                                </div>

                            </div>
                        )}

                        {selectedSource.type === "document" && selectedSource.fileUrl && (
                            <div className="mt-4 p-4 border border-border rounded-lg">
                                <h4 className="font-medium mb-2 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-orange-500" />
                                    Document Details
                                </h4>
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-blue-500 hover:text-blue-600"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDownloadDocument();
                                    }}
                                >
                                    Download Document
                                </Button>
                            </div>
                        )}

                        {selectedSource.type === "faq" && selectedSource.faqs && selectedSource.faqs.length > 0 && (
                            <div className="mt-4 p-4 border border-border rounded-lg">
                                <h4 className="font-medium mb-4 flex items-center">
                                    <MessageCircleQuestion className="w-4 h-4 mr-2 text-purple-500" />
                                    FAQ Data
                                </h4>
                                <div className="space-y-4">
                                    {selectedSource.faqs.map((faq, idx) => (
                                        <div key={idx} className="bg-muted/20 p-3 rounded-md border border-border">
                                            <p className="font-semibold text-foreground mb-1 flex items-start">
                                                <span className="text-muted-foreground mr-2 font-bold">Q:</span>
                                                {faq.question}
                                            </p>
                                            <p className="text-muted-foreground flex items-start text-sm">
                                                <span className="text-muted-foreground mr-2 font-bold">A:</span>
                                                <span className="whitespace-pre-wrap">{faq.answer}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedSource.errorMessage && (
                            <div className="mt-4 p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500 flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Error Message</p>
                                    <p className="text-sm">{selectedSource.errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {selectedSource.extractedText !== undefined && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                        Extracted Data
                                    </h4>
                                    <Button size="sm" variant="outline" disabled={isSavingText} onClick={handleSaveText} className="h-8">
                                        {isSavingText ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : null}
                                        Save Updates
                                    </Button>
                                </div>
                                <textarea
                                    className="w-full bg-muted/30 p-3 rounded text-xs text-muted-foreground whitespace-pre-wrap min-h-[300px] border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                    value={extractedTextState}
                                    onChange={(e) => setExtractedTextState(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    You can manually edit the extracted text to fix any extraction errors. Saving will instantly update the AI&apos;s knowledge base.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="pt-4 border-t border-border mt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
