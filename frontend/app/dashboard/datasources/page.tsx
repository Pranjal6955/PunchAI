"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Globe,
    FileText,
    MessageCircleQuestion,
    Trash2,
    Layers,
    Building2,
    Info,
    Target,
    User as UserIcon,
    Edit2
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { DataSource, SourceType, AddDataSourceFormData } from "./components/types";
import { DataSourceTable } from "./components/view-toggle/DataSourceTable";
import { AddDataSourceModal } from "./components/AddDataSourceModal";
import { EditDataSourceModal } from "./components/EditDataSourceModal";
import { ViewDataSourceModal } from "./components/ViewDataSourceModal";
import { EditCompanyContextModal } from "./components/EditCompanyContextModal";

export default function DataSourcesPage() {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<SourceType>("website");
    const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

    // Existing FAQ names for autocomplete
    const existingFaqNames = Array.from(new Set(sources.filter(s => s.type === "faq").map(s => s.name)));

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditContextModalOpen, setIsEditContextModalOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

    // Form states
    const [formData, setFormData] = useState<AddDataSourceFormData>({
        name: "",
        url: "",
        question: "",
        answer: "",
        faqs: [{ question: "", answer: "" }]
    });
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Extracted Text Editing State
    const [extractedTextState, setExtractedTextState] = useState("");
    const [isSavingText, setIsSavingText] = useState(false);

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

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const res = await axios.get(`${apiUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserData(res.data);
        } catch (error) {
            console.error("Failed to fetch user data", error);
        }
    };

    useEffect(() => {
        fetchSources();
        fetchUserData();
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
        setFormData({ name: "", url: "", question: "", answer: "", faqs: [{ question: "", answer: "" }] });
        setFile(null);
    };

    const handleOpenAddModal = (type: SourceType) => {
        setActiveTab(type);
        resetForm();
        setIsAddModalOpen(true);
    };

    const handleOpenViewModal = (source: DataSource) => {
        setSelectedSource(source);
        setExtractedTextState(source.extractedText || "");
        setIsViewModalOpen(true);
    };

    const handleOpenEditModal = (source: DataSource) => {
        setSelectedSource(source);
        setFormData({
            name: source.name,
            url: source.sourceUrl || "",
            question: "",
            answer: "",
            faqs: source.type === 'faq' && source.faqs && source.faqs.length > 0 ? source.faqs : [{ question: "", answer: "" }]
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
                    name: formData.name || (formData.faqs && formData.faqs.length > 0 ? formData.faqs[0].question.slice(0, 30) : ""),
                    faqs: formData.faqs
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
                    faqs: formData.faqs
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

    const handleSaveText = async () => {
        if (!selectedSource) return;
        setIsSavingText(true);
        try {
            await api.put(`/datasources/text/${selectedSource._id}`, { extractedText: extractedTextState });
            setIsViewModalOpen(false);
            fetchSources();
        } catch (error) {
            console.error("Failed to update text", error);
        } finally {
            setIsSavingText(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this data source? Its knowledge will be removed from your AI.")) return;

        try {
            await api.delete(`/datasources/${id}`);
            setSelectedSourceIds(prev => prev.filter(selectedId => selectedId !== id));
            fetchSources();
        } catch (error) {
            console.error("Failed to delete source", error);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedSourceIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const getFilteredSources = (type: string) => {
        if (type === "all") return sources;
        return sources.filter(s => s.type === type);
    };

    const handleSelectAll = (type: string) => {
        const filtered = getFilteredSources(type);
        const allIds = filtered.map(s => s._id);

        const allSelected = filtered.length > 0 &&
            allIds.every(id => selectedSourceIds.includes(id));

        if (allSelected) {
            // Deselect all for this type
            setSelectedSourceIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            // Select all for this type
            setSelectedSourceIds(prev => Array.from(new Set([...prev, ...allIds])));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSourceIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedSourceIds.length} selected data sources? Their knowledge will be removed from your AI.`)) return;

        try {
            await Promise.all(selectedSourceIds.map(id => api.delete(`/datasources/${id}`)));
            setSelectedSourceIds([]);
            fetchSources();
        } catch (error) {
            console.error("Failed to delete multiple sources", error);
        }
    };


    return (
        <div className="flex flex-col gap-6 p-6 w-full h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Data Sources</h1>
                    <p className="text-muted-foreground">Connect the data you want your AI agents to learn from.</p>
                </div>

                <div className="flex gap-4 items-center">
                    {selectedSourceIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedSourceIds.length})
                        </Button>
                    )}

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
            </div>

            {userData && (
                <Card className="border-border bg-card text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                                <Building2 className="w-5 h-5 text-primary" />
                                Company Profile
                            </CardTitle>
                            <CardDescription>
                                Core context and configuration for your AI agents.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditContextModalOpen(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border border-border rounded-xl bg-muted/10">
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Company
                                    </p>
                                    <p className="font-semibold text-foreground text-base">{userData.companyName || "Not specified"}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Industry
                                    </p>
                                    <p className="font-semibold text-foreground text-base">{userData.industry || "Not specified"}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Website
                                    </p>
                                    <div className="font-semibold text-foreground text-base">
                                        {userData.websiteUrl ? (
                                            <a href={userData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {userData.websiteUrl}
                                            </a>
                                        ) : "Not specified"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 border border-border rounded-xl bg-muted/5 space-y-5">
                                    <h4 className="font-semibold flex items-center gap-2 text-foreground text-base">
                                        <UserIcon className="w-4 h-4 text-primary" /> Agent Persona
                                    </h4>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Personality</p>
                                        <div className="flex">
                                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium">
                                                {userData.chatbotPersonality || "Not specified"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-3 border-t border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground">Languages</p>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.supportedLanguages?.length > 0 ? (
                                                userData.supportedLanguages.map((l: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-secondary border border-border text-secondary-foreground rounded-md text-sm font-medium">{l}</span>
                                                ))
                                            ) : <span className="text-sm text-muted-foreground">None specified</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border border-border rounded-xl bg-muted/5 space-y-5">
                                    <h4 className="font-semibold flex items-center gap-2 text-foreground text-base">
                                        <Target className="w-4 h-4 text-primary" /> Supported Capabilities
                                    </h4>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Assigned Tasks</p>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.chatbotPurpose?.length > 0 ? (
                                                userData.chatbotPurpose.map((p: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-card text-foreground border border-border rounded-md text-sm font-medium shadow-sm">{p}</span>
                                                ))
                                            ) : <span className="text-sm text-muted-foreground">None specified</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-border bg-card text-foreground">
                <CardHeader>
                    <CardTitle>Connected Sources</CardTitle>
                    <CardDescription className="text-muted-foreground">Manage all existing data context for your chatbots.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4 grid w-full grid-cols-4 bg-muted/50 border border-border">
                            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-sm">
                                <Layers className="w-4 h-4 mr-2" />
                                All Sources
                            </TabsTrigger>
                            <TabsTrigger value="website" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-sm">
                                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                                Websites
                            </TabsTrigger>
                            <TabsTrigger value="document" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-sm">
                                <FileText className="w-4 h-4 mr-2 text-orange-500" />
                                Upload Docs
                            </TabsTrigger>
                            <TabsTrigger value="faq" className="data-[state=active]:bg-background data-[state=active]:text-foreground shadow-sm">
                                <MessageCircleQuestion className="w-4 h-4 mr-2 text-purple-500" />
                                FAQs
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-0 border rounded-md border-border">
                            <DataSourceTable
                                filteredSources={getFilteredSources("all")}
                                loading={loading}
                                handleOpenAddModal={handleOpenAddModal}
                                handleOpenViewModal={handleOpenViewModal}
                                handleOpenEditModal={handleOpenEditModal}
                                handleDelete={handleDelete}
                                selectedIds={selectedSourceIds}
                                onSelect={handleSelect}
                                onSelectAll={() => handleSelectAll("all")}
                            />
                        </TabsContent>
                        <TabsContent value="website" className="mt-0 border rounded-md border-border">
                            <DataSourceTable
                                filteredSources={getFilteredSources("website")}
                                loading={loading}
                                handleOpenAddModal={handleOpenAddModal}
                                handleOpenViewModal={handleOpenViewModal}
                                handleOpenEditModal={handleOpenEditModal}
                                handleDelete={handleDelete}
                                selectedIds={selectedSourceIds}
                                onSelect={handleSelect}
                                onSelectAll={() => handleSelectAll("website")}
                            />
                        </TabsContent>
                        <TabsContent value="document" className="mt-0 border rounded-md border-border">
                            <DataSourceTable
                                filteredSources={getFilteredSources("document")}
                                loading={loading}
                                handleOpenAddModal={handleOpenAddModal}
                                handleOpenViewModal={handleOpenViewModal}
                                handleOpenEditModal={handleOpenEditModal}
                                handleDelete={handleDelete}
                                selectedIds={selectedSourceIds}
                                onSelect={handleSelect}
                                onSelectAll={() => handleSelectAll("document")}
                            />
                        </TabsContent>
                        <TabsContent value="faq" className="mt-0 border rounded-md border-border">
                            <DataSourceTable
                                filteredSources={getFilteredSources("faq")}
                                loading={loading}
                                handleOpenAddModal={handleOpenAddModal}
                                handleOpenViewModal={handleOpenViewModal}
                                handleOpenEditModal={handleOpenEditModal}
                                handleDelete={handleDelete}
                                selectedIds={selectedSourceIds}
                                onSelect={handleSelect}
                                onSelectAll={() => handleSelectAll("faq")}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <AddDataSourceModal
                isOpen={isAddModalOpen}
                setIsOpen={setIsAddModalOpen}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                formData={formData}
                setFormData={setFormData}
                setFile={setFile}
                handleAddSubmit={handleAddSubmit}
                isSubmitting={isSubmitting}
                existingFaqNames={existingFaqNames}
            />

            <EditDataSourceModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                selectedSource={selectedSource}
                formData={formData}
                setFormData={setFormData}
                setFile={setFile}
                handleEditSubmit={handleEditSubmit}
                isSubmitting={isSubmitting}
            />

            <ViewDataSourceModal
                isOpen={isViewModalOpen}
                setIsOpen={setIsViewModalOpen}
                selectedSource={selectedSource}
                extractedTextState={extractedTextState}
                setExtractedTextState={setExtractedTextState}
                handleSaveText={handleSaveText}
                isSavingText={isSavingText}
            />

            <EditCompanyContextModal
                isOpen={isEditContextModalOpen}
                setIsOpen={setIsEditContextModalOpen}
                userData={userData}
                fetchUserData={fetchUserData}
            />
        </div >
    );
}