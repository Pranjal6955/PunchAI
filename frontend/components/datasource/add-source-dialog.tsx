"use client"

import * as React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    FileUp,
    Globe,
    HelpCircle,
    Plus,
    Loader2,
    X,
    MessageSquarePlus
} from "lucide-react"
import { uploadPDF, addURL, addFAQ } from "@/lib/api-session"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"


interface AddSourceDialogProps {
    botId: string;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function AddSourceDialog({ botId, onSuccess, trigger }: AddSourceDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("file");

    // File State
    const [file, setFile] = useState<File | null>(null);

    // URL State
    const [url, setUrl] = useState("");

    // FAQ State
    const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
    const [faqName, setFaqName] = useState("");

    const resetForm = () => {
        setFile(null);
        setUrl("");
        setFaqs([{ question: "", answer: "" }]);
        setFaqName("");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const addFaqRow = () => {
        setFaqs([...faqs, { question: "", answer: "" }]);
    };

    const removeFaqRow = (index: number) => {
        setFaqs(faqs.filter((_, i) => i !== index));
    };

    const updateFaq = (index: number, field: "question" | "answer", value: string) => {
        const newFaqs = [...faqs];
        newFaqs[index][field] = value;
        setFaqs(newFaqs);
    };

    const handleSubmit = async () => {
        if (!botId) {
            toast.error("Please select a chatbot first");
            return;
        }

        setLoading(true);
        try {
            let result;
            if (activeTab === "file") {
                if (!file) {
                    toast.error("Please select a file");
                    setLoading(false);
                    return;
                }
                result = await uploadPDF(botId, file);
            } else if (activeTab === "url") {
                if (!url) {
                    toast.error("Please enter a URL");
                    setLoading(false);
                    return;
                }
                result = await addURL(botId, url);
            } else if (activeTab === "faq") {
                if (!faqName || faqs.some(f => !f.question || !f.answer)) {
                    toast.error("Please fill all FAQ fields and provide a name");
                    setLoading(false);
                    return;
                }
                result = await addFAQ(botId, faqName, faqs);
            }

            if (result) {
                toast.success("Data source added successfully");
                setIsOpen(false);
                resetForm();
                onSuccess();
            } else {
                toast.error("Failed to add data source");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-none shadow-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Data Source
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-none border-border/60">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold tracking-tight">Add Data Source</DialogTitle>
                    <DialogDescription>
                        Import knowledge from various sources to train your chatbot.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50 p-1">
                        <TabsTrigger value="file" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <FileUp className="mr-2 h-4 w-4" /> File
                        </TabsTrigger>
                        <TabsTrigger value="url" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <Globe className="mr-2 h-4 w-4" /> URL
                        </TabsTrigger>
                        <TabsTrigger value="faq" className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none">
                            <HelpCircle className="mr-2 h-4 w-4" /> FAQ
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="py-4"
                        >
                            <TabsContent value="file" className="mt-0 space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="pdf">PDF Document</Label>
                                    <div
                                        className="border-2 border-dashed border-border/60 rounded-none p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer bg-muted/5"
                                        onClick={() => document.getElementById('pdf-upload')?.click()}
                                    >
                                        <FileUp className="h-10 w-10 text-muted-foreground" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium">
                                                {file ? file.name : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Only PDF files are supported (max 10MB)
                                            </p>
                                        </div>
                                        <input
                                            id="pdf-upload"
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="url">Website URL</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://example.com/docs"
                                        className="rounded-none border-border/60"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                                        We will crawl this page and extract all relevant text content.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="faq" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="faqName">Dataset Name</Label>
                                    <Input
                                        id="faqName"
                                        placeholder="e.g. Common Questions"
                                        className="rounded-none border-border/60"
                                        value={faqName}
                                        onChange={(e) => setFaqName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="space-y-3 p-4 border border-border/60 bg-muted/10 relative group">
                                            {faqs.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeFaqRow(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Question</Label>
                                                <Input
                                                    placeholder="What is your return policy?"
                                                    className="rounded-none border-border/60 bg-background"
                                                    value={faq.question}
                                                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Answer</Label>
                                                <textarea
                                                    placeholder="Our return policy lasts 30 days..."
                                                    className="w-full min-h-[80px] p-2 text-sm bg-background border border-border/60 focus:outline-none focus:ring-0 focus:border-primary transition-colors resize-none rounded-none"
                                                    value={faq.answer}
                                                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-none border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                                    onClick={addFaqRow}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add FAQ Row
                                </Button>
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                        className="rounded-none shadow-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-none shadow-lg shadow-primary/20"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Processing..." : "Add Source"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
