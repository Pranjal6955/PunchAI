"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Plus,
    Database,
    Link as LinkIcon,
    FileText,
    HelpCircle,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreVertical,
    ArrowLeft,
    Eye,
    Edit2,
    Save,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { botApi, dataSourceApi } from "@/lib/api-client"
import { format } from "date-fns"
import { useHeader } from "@/lib/header-context"

export default function BotDataSourcePage() {
    const params = useParams()
    const router = useRouter()
    const botId = params.id as string
    const { setTitle } = useHeader()

    const [bot, setBot] = useState<any>(null)
    const [sources, setSources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchLoading, setFetchLoading] = useState(false)

    // Dialog states
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isUrlOpen, setIsUrlOpen] = useState(false)
    const [isFaqOpen, setIsFaqOpen] = useState(false)
    const [isChunksOpen, setIsChunksOpen] = useState(false)

    // Form states
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [url, setUrl] = useState("")
    const [faqData, setFaqData] = useState({ name: "", faqs: [{ question: "", answer: "" }] })

    // Chunk states
    const [chunks, setChunks] = useState<any[]>([])
    const [activeSource, setActiveSource] = useState<any>(null)
    const [editingChunkId, setEditingChunkId] = useState<string | null>(null)
    const [editingContent, setEditingContent] = useState("")

    useEffect(() => {
        if (botId) {
            fetchBotAndSources()
        }
    }, [botId])

    useEffect(() => {
        return () => setTitle(null)
    }, [])

    const fetchBotAndSources = async () => {
        try {
            setLoading(true)
            const botData = await botApi.get(botId)
            setBot(botData)
            setTitle(`Knowledge: ${botData.name}`)

            const sourcesResponse = await dataSourceApi.list(botId)
            setSources(sourcesResponse.data)
        } catch (error: any) {
            toast.error("Failed to load chatbot or sources")
            router.push("/dashboard/dataSource")
        } finally {
            setLoading(false)
        }
    }

    const fetchSourcesOnly = async () => {
        try {
            setFetchLoading(true)
            const response = await dataSourceApi.list(botId)
            setSources(response.data)
        } catch (error: any) {
            toast.error("Failed to refresh sources")
        } finally {
            setFetchLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) return
        try {
            toast.loading("Uploading document...")
            await dataSourceApi.upload(botId, uploadFile)
            toast.dismiss()
            toast.success("Document uploaded successfully")
            setIsUploadOpen(false)
            setUploadFile(null)
            fetchSourcesOnly()
        } catch (error: any) {
            toast.dismiss()
            toast.error(error.message || "Upload failed")
        }
    }

    const handleAddUrl = async () => {
        if (!url) return
        try {
            toast.loading("Scraping URL...")
            await dataSourceApi.addUrl(botId, url)
            toast.dismiss()
            toast.success("URL added successfully")
            setIsUrlOpen(false)
            setUrl("")
            fetchSourcesOnly()
        } catch (error: any) {
            toast.dismiss()
            toast.error(error.message || "Failed to add URL")
        }
    }

    const handleAddFaq = async () => {
        if (!faqData.name) return
        try {
            await dataSourceApi.addFaq(botId, faqData.name, faqData.faqs)
            toast.success("FAQ batch added successfully")
            setIsFaqOpen(false)
            setFaqData({ name: "", faqs: [{ question: "", answer: "" }] })
            fetchSourcesOnly()
        } catch (error: any) {
            toast.error(error.message || "Failed to add FAQs")
        }
    }

    const handleDeleteSource = async (id: string) => {
        if (!confirm("Are you sure you want to delete this source?")) return
        try {
            await dataSourceApi.delete(id)
            toast.success("Source deleted")
            fetchSourcesOnly()
        } catch (error: any) {
            toast.error("Delete failed")
        }
    }

    const fetchChunks = async (source: any) => {
        try {
            setActiveSource(source)
            setIsChunksOpen(true)
            const response = await dataSourceApi.listChunks(source.id)
            setChunks(response)
        } catch (error: any) {
            toast.error("Failed to load extracted data")
        }
    }

    const handleUpdateChunk = async (chunkId: string) => {
        try {
            await dataSourceApi.updateChunk(chunkId, editingContent)
            toast.success("Content updated")
            setEditingChunkId(null)
            fetchChunks(activeSource)
        } catch (error: any) {
            toast.error("Failed to update content")
        }
    }

    const handleDeleteChunk = async (chunkId: string) => {
        if (!confirm("Delete this chunk? This cannot be undone.")) return
        try {
            await dataSourceApi.deleteChunk(chunkId)
            toast.success("Chunk deleted")
            fetchChunks(activeSource)
        } catch (error: any) {
            toast.error("Failed to delete chunk")
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case "PROCESSING": return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
            case "FAILED": return <AlertCircle className="h-4 w-4 text-red-500" />
            default: return <Clock className="h-4 w-4 text-muted-foreground" />
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
                        <p className="text-muted-foreground text-sm uppercase font-mono tracking-widest">{bot?.name}</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2 h-9">
                            <Plus className="h-4 w-4" /> Add Source
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setIsUploadOpen(true)} className="gap-2">
                            <FileText className="h-4 w-4" /> Upload PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsUrlOpen(true)} className="gap-2">
                            <LinkIcon className="h-4 w-4" /> Add Website URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsFaqOpen(true)} className="gap-2">
                            <HelpCircle className="h-4 w-4" /> Add FAQ Batch
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {sources.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 bg-muted/5">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Database className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-1">No data sources yet</CardTitle>
                    <CardDescription className="text-center max-w-sm mb-6">
                        Provide knowledge to <b>{bot?.name}</b> by uploading files, linking websites, or entering FAQs.
                    </CardDescription>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>Upload PDF</Button>
                        <Button variant="outline" size="sm" onClick={() => setIsUrlOpen(true)}>Add URL</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sources.map((source) => (
                        <Card key={source.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        {source.type === 'FILE' && <FileText className="h-4 w-4 text-primary" />}
                                        {source.type === 'URL' && <LinkIcon className="h-4 w-4 text-primary" />}
                                        {source.type === 'TEXT' && <HelpCircle className="h-4 w-4 text-primary" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(source.status)}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => fetchSourcesOnly()}>Refresh</DropdownMenuItem>
                                                {(source.type === 'FILE' || source.type === 'URL') && (
                                                    <DropdownMenuItem onClick={() => fetchChunks(source)}>
                                                        <Eye className="h-4 w-4 mr-2" /> Manage Data
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteSource(source.id)}>
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CardTitle className="text-sm mt-3 truncate">{source.name}</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-mono tracking-tighter">
                                    {source.type} • {format(new Date(source.createdAt), "MMM d, yyyy")}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dialogs remain similar to the previous version but botId is from params */}
            {/* Upload PDF Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Knowledge Source</DialogTitle>
                        <DialogDescription>Upload a PDF document to train your chatbot.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="file">PDF File</Label>
                            <Input id="file" type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!uploadFile}>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add URL Dialog */}
            <Dialog open={isUrlOpen} onOpenChange={setIsUrlOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Scrape Website</DialogTitle>
                        <DialogDescription>Enter a URL to extract content from.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL Address</Label>
                            <Input id="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUrlOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUrl} disabled={!url}>Start Scraping</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add FAQ Dialog */}
            <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add FAQ Collection</DialogTitle>
                        <DialogDescription>Create a set of questions and answers for your chatbot.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="faqName">Collection Name</Label>
                            <Input id="faqName" placeholder="Customer FAQs" value={faqData.name} onChange={(e) => setFaqData({ ...faqData, name: e.target.value })} />
                        </div>
                        <div className="space-y-4 mt-2">
                            <Label>Question & Answer Pairs</Label>
                            {faqData.faqs.map((faq, index) => (
                                <div key={index} className="grid gap-2 p-4 border rounded-xl bg-muted/5">
                                    <Input placeholder="Question" value={faq.question} onChange={(e) => {
                                        const newFaqs = [...faqData.faqs]
                                        newFaqs[index].question = e.target.value
                                        setFaqData({ ...faqData, faqs: newFaqs })
                                    }} />
                                    <Input placeholder="Answer" value={faq.answer} onChange={(e) => {
                                        const newFaqs = [...faqData.faqs]
                                        newFaqs[index].answer = e.target.value
                                        setFaqData({ ...faqData, faqs: newFaqs })
                                    }} />
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => setFaqData({ ...faqData, faqs: [...faqData.faqs, { question: "", answer: "" }] })}>
                                <Plus className="h-3 w-3 mr-1" /> Add pair
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFaqOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFaq} disabled={!faqData.name || faqData.faqs[0].question === ""}>Save FAQ Collection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Manage Chunks Dialog */}
            <Dialog open={isChunksOpen} onOpenChange={setIsChunksOpen}>
                <DialogContent className="max-w-[90vw] md:max-w-6xl lg:max-w-screen-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                {activeSource?.type === 'FILE' ? <FileText className="h-5 w-5 text-primary" /> : <LinkIcon className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <DialogTitle>Extracted Content</DialogTitle>
                                <DialogDescription>Review and refine the knowledge extracted from {activeSource?.name}.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
                        {chunks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-[2rem] bg-muted/5">
                                <Database className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg">No data chunks found.</p>
                            </div>
                        ) : chunks.map((chunk) => (
                            <div key={chunk.id} className="relative group border rounded-[2rem] p-8 bg-muted/5 hover:bg-muted/10 transition-all duration-300">
                                <div className="absolute right-8 top-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingChunkId === chunk.id ? (
                                        <>
                                            <Button size="sm" variant="outline" className="h-9 border-green-200/50 text-green-600 bg-green-50/50 hover:bg-green-100/50" onClick={() => handleUpdateChunk(chunk.id)}>
                                                <Save className="h-4 w-4 mr-2" /> Save Changes
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => setEditingChunkId(null)}>
                                                <X className="h-4 w-4 mr-1" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" variant="outline" className="h-9 bg-background/50 hover:bg-background" onClick={() => {
                                                setEditingChunkId(chunk.id)
                                                setEditingContent(chunk.content)
                                            }}>
                                                <Edit2 className="h-4 w-4 mr-2" /> Edit Content
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteChunk(chunk.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div className="pr-32">
                                    <p className="text-[11px] items-center uppercase font-mono tracking-[0.2em] text-muted-foreground/60 mb-6 flex gap-2">
                                        <Clock className="h-3 w-3" /> Processed {format(new Date(chunk.createdAt), "MMM d, yyyy • HH:mm")}
                                    </p>
                                    {editingChunkId === chunk.id ? (
                                        <Textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="min-h-[250px] bg-background text-base leading-relaxed p-6 rounded-2xl border-primary/20 ring-primary/20"
                                            placeholder="Update extraction text..."
                                        />
                                    ) : (
                                        <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                            {chunk.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsChunksOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
