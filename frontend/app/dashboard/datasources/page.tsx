"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Plus,
    Globe,
    FileText,
    MessageCircleQuestion,
    Trash2,
    RefreshCw,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { WebsiteFields } from "./components/WebsiteFields";
import { DocumentFields } from "./components/DocumentFields";
import { FaqFields } from "./components/FaqFields";

// Types
type SourceType = "website" | "document" | "faq";
type SourceStatus = "pending" | "processing" | "completed" | "failed";

interface FAQ {
    question: string;
    answer: string;
}

interface DataSource {
    _id: string;
    name: string;
    type: SourceType;
    status: SourceStatus;
    vectorCount: number;
    sourceUrl?: string;
    faqs?: FAQ[];
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export default function DataSourcesPage() {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SourceType>("website");

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        url: "",
        question: "",
        answer: ""
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Sources
    const fetchSources = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const res = await axios.get(`${apiUrl}/datasources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSources(res.data);
        } catch (error) {
            console.error("Failed to fetch data sources", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
        // Set up polling for processing items
        const interval = setInterval(() => {
            setSources(prev => {
                if (prev.some(s => s.status === 'pending' || s.status === 'processing')) {
                    fetchSources(); // Re-fetch only if there are processing items
                }
                return prev;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const resetForm = () => {
        setFormData({ name: "", url: "", question: "", answer: "" });
        setFile(null);
    };

    const handleOpenAddModal = (type: SourceType) => {
        setActiveTab(type);
        resetForm();
        setIsAddModalOpen(true);
    };

    const handleOpenEditModal = (source: DataSource) => {
        setSelectedSource(source);
        setFormData({
            name: source.name,
            url: source.sourceUrl || "",
            question: source.type === 'faq' && source.faqs ? source.faqs[0]?.question : "",
            answer: source.type === 'faq' && source.faqs ? source.faqs[0]?.answer : ""
        });
        setFile(null);
        setIsEditModalOpen(true);
    };

    // Setup Axios Instance with Auth
    const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    });

    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (activeTab === "website") {
                await api.post("/datasources/website", { name: formData.name, url: formData.url });
            } else if (activeTab === "document") {
                const data = new FormData();
                data.append("name", formData.name || file?.name || "Document");
                if (file) data.append("document", file);
                await api.post("/datasources/document", data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else if (activeTab === "faq") {
                await api.post("/datasources/faq", {
                    name: formData.name || formData.question.slice(0, 30),
                    question: formData.question,
                    answer: formData.answer
                });
            }

            setIsAddModalOpen(false);
            resetForm();
            fetchSources();
        } catch (error) {
            console.error("Error adding source", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSource) return;

        setIsSubmitting(true);
        try {
            if (selectedSource.type === "website") {
                await api.put(`/datasources/website/${selectedSource._id}`, {
                    name: formData.name,
                    url: formData.url
                });
            } else if (selectedSource.type === "document") {
                const data = new FormData();
                data.append("name", formData.name);
                if (file) data.append("document", file);

                await api.put(`/datasources/document/${selectedSource._id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } else if (selectedSource.type === "faq") {
                await api.put(`/datasources/faq/${selectedSource._id}`, {
                    name: formData.name,
                    faqs: [{ question: formData.question, answer: formData.answer }]
                });
            }

            setIsEditModalOpen(false);
            setSelectedSource(null);
            fetchSources();
        } catch (error) {
            console.error("Error updating source", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this data source? Its knowledge will be removed from your AI.")) return;

        try {
            await api.delete(`/datasources/${id}`);
            fetchSources();
        } catch (error) {
            console.error("Failed to delete source", error);
        }
    };

    const getStatusBadge = (status: SourceStatus) => {
        switch (status) {
            case "completed": return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
            case "processing": return <Badge variant="secondary" className="text-primary bg-primary/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
            case "pending": return <Badge variant="outline" className="text-slate-600"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
            case "failed": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
        }
    };

    const getTypeIcon = (type: SourceType) => {
        switch (type) {
            case "website": return <Globe className="w-4 h-4 text-blue-500" />;
            case "document": return <FileText className="w-4 h-4 text-orange-500" />;
            case "faq": return <MessageCircleQuestion className="w-4 h-4 text-purple-500" />;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 w-full h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Knowledge Sources</h1>
                    <p className="text-muted-foreground">Connect the data you want your AI agents to learn from.</p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => handleOpenAddModal("website")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Globe className="w-4 h-4 mr-2" />
                        Add Website
                    </Button>
                    <Button onClick={() => handleOpenAddModal("document")} variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">
                        <FileText className="w-4 h-4 mr-2" />
                        Upload Doc
                    </Button>
                    <Button onClick={() => handleOpenAddModal("faq")} variant="secondary" className="bg-muted text-foreground hover:bg-muted/80">
                        <MessageCircleQuestion className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                </div>
            </div>

            <Card className="border-border bg-card text-foreground">
                <CardHeader>
                    <CardTitle>Connected Sources</CardTitle>
                    <CardDescription className="text-muted-foreground">Manage all existing data context for your chatbots.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="border-border">
                            <TableRow className="border-b border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                                <TableHead className="text-muted-foreground font-medium whitespace-nowrap">Vectors</TableHead>
                                <TableHead className="text-muted-foreground font-medium">Added</TableHead>
                                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && sources.length === 0 ? (
                                <TableRow className="border-b border-border">
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Loading your data sources...
                                    </TableCell>
                                </TableRow>
                            ) : sources.length === 0 ? (
                                <TableRow className="border-b border-border">
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <FileText className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="font-medium text-muted-foreground">No data sources yet</p>
                                            <p className="text-sm mt-1 max-w-sm text-center">Your AI doesn't have any custom knowledge. Add a website, document, or FAQ to get started.</p>
                                            <Button onClick={() => handleOpenAddModal("website")} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sources.map((source) => (
                                    <TableRow key={source._id} className="border-b border-border border-opacity-50 hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{source.name}</span>
                                                {source.type === 'website' && <span className="text-xs text-muted-foreground truncate max-w-xs">{source.sourceUrl}</span>}
                                                {source.status === 'failed' && <span className="text-xs text-red-400 truncate max-w-xs">{source.errorMessage}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center capitalize text-muted-foreground">
                                                {getTypeIcon(source.type)}
                                                <span className="ml-2">{source.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(source.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">{source.vectorCount.toLocaleString()}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                            {format(new Date(source.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEditModal(source)}
                                                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(source._id)}
                                                    className="text-muted-foreground hover:text-red-400 hover:bg-muted hover:bg-opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ADD MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle>Add Data Source</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Inject new knowledge into your AI agent's Brain.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SourceType)} className="mt-4">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border">
                            <TabsTrigger value="website" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Website</TabsTrigger>
                            <TabsTrigger value="document" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Document</TabsTrigger>
                            <TabsTrigger value="faq" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">FAQ</TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
                            {activeTab === "website" && (
                                <WebsiteFields formData={formData} setFormData={setFormData} />
                            )}

                            {activeTab === "document" && (
                                <DocumentFields formData={formData} setFormData={setFormData} setFile={setFile} isEditMode={false} />
                            )}

                            {activeTab === "faq" && (
                                <FaqFields formData={formData} setFormData={setFormData} />
                            )}

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-border bg-transparent hover:bg-muted text-muted-foreground">Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save & Process
                                </Button>
                            </DialogFooter>
                        </form>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle>Edit Data Source</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update {selectedSource?.name}. Changing content will re-process the data.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                        {selectedSource?.type === "website" && (
                            <WebsiteFields formData={formData} setFormData={setFormData} />
                        )}

                        {selectedSource?.type === "document" && (
                            <DocumentFields formData={formData} setFormData={setFormData} setFile={setFile} isEditMode={true} />
                        )}

                        {selectedSource?.type === "faq" && (
                            <FaqFields formData={formData} setFormData={setFormData} />
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-border bg-transparent hover:bg-muted text-muted-foreground">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Update Data
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}