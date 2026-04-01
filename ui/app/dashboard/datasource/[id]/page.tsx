"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Bot,
    Plus,
    FileText,
    Globe,
    MessageSquare,
    Trash2,
    Loader2,
    ChevronLeft,
    Upload,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock,
    MoreVertical,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { botApi, datasourceApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

export default function DataSourceManagerPage() {
    const { id } = useParams()
    const router = useRouter()

    const [bot, setBot] = useState<any>(null)
    const [sources, setSources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sourcesLoading, setSourcesLoading] = useState(false)

    // Dialog states
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false)
    const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false)

    // Form states
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [urlInput, setUrlInput] = useState("")
    const [faqData, setFaqData] = useState({ name: "", question: "", answer: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchBotData = async () => {
            if (!id) return
            try {
                setLoading(true)
                const res = await botApi.get(id as string)
                setBot(res)
                fetchSources(id as string)
            } catch (err) {
                console.error("Failed to load bot:", err)
                toast.error("Bot not found")
                router.push("/dashboard/datasource")
            } finally {
                setLoading(false)
            }
        }
        fetchBotData()
    }, [id, router])

    const fetchSources = async (botId: string) => {
        try {
            setSourcesLoading(true)
            const res = await datasourceApi.list(botId)
            setSources(res.data || [])
        } catch (err) {
            console.error("Failed to load sources:", err)
            toast.error("Failed to load data sources")
        } finally {
            setSourcesLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!uploadFile || !bot) return
        try {
            setIsSubmitting(true)
            await datasourceApi.uploadFile(bot.id, uploadFile)
            toast.success("File uploaded successfully")
            setIsUploadDialogOpen(false)
            setUploadFile(null)
            fetchSources(bot.id)
        } catch (err) {
            toast.error("Upload failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddUrl = async () => {
        if (!urlInput || !bot) return
        try {
            setIsSubmitting(true)
            await datasourceApi.addUrl(bot.id, urlInput)
            toast.success("URL added successfully")
            setIsUrlDialogOpen(false)
            setUrlInput("")
            fetchSources(bot.id)
        } catch (err) {
            toast.error("Failed to add URL")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddFaq = async () => {
        if (!faqData.question || !faqData.answer || !bot) return
        try {
            setIsSubmitting(true)
            await datasourceApi.addFaqs(bot.id, faqData.name || "FAQ Entry", [
                { question: faqData.question, answer: faqData.answer }
            ])
            toast.success("FAQ added successfully")
            setIsFaqDialogOpen(false)
            setFaqData({ name: "", question: "", answer: "" })
            fetchSources(bot.id)
        } catch (err) {
            toast.error("Failed to add FAQ")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSource = async (sourceId: string) => {
        if (!confirm("Are you sure?")) return
        try {
            await datasourceApi.delete(sourceId)
            setSources(sources.filter(s => s.id !== sourceId))
            toast.success("Source deleted")
        } catch (err) {
            toast.error("Delete failed")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5"><CheckCircle2 className="size-3" /> Ready</Badge>
            case "PROCESSING":
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5"><Clock className="size-3 animate-spin" /> Processing</Badge>
            case "FAILED":
                return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5"><AlertCircle className="size-3" /> Failed</Badge>
            default:
                return <Badge variant="outline" className="bg-muted text-muted-foreground gap-1.5"><Clock className="size-3" /> Pending</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-8 h-[calc(100vh-8rem)]">
                <Skeleton className="h-12 w-64" />
                <div className="grid gap-6 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="flex-1 rounded-3xl" />
            </div>
        )
    }

    if (!bot) return null

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/datasource")}
                        className="rounded-full"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{bot.name}</h1>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">Bot ID: {bot.id.slice(-6)}</Badge>
                        </div>
                        <p className="text-muted-foreground">Manage data and knowledge for this agent</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"><Plus className="size-4" /> Add Source</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add Data Source</DialogTitle>
                                <DialogDescription>Choose a method to provide knowledge to your AI agent.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <Tabs defaultValue="file" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
                                        <TabsTrigger value="file" className="rounded-lg gap-2"><FileText className="size-4" /> File</TabsTrigger>
                                        <TabsTrigger value="url" className="rounded-lg gap-2"><Globe className="size-4" /> URL</TabsTrigger>
                                        <TabsTrigger value="faq" className="rounded-lg gap-2"><MessageSquare className="size-4" /> FAQ</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="file" className="space-y-4 mt-6">
                                        <div
                                            className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer relative"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                if (e.dataTransfer.files?.[0]) setUploadFile(e.dataTransfer.files[0])
                                            }}
                                        >
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept=".pdf"
                                                onChange={(e) => e.target.files?.[0] && setUploadFile(e.target.files[0])}
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-primary/20 rounded-full text-primary">
                                                    <Upload className="size-6" />
                                                </div>
                                                {uploadFile ? (
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-primary">{uploadFile.name}</p>
                                                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="font-medium">Click or drag & drop</p>
                                                        <p className="text-sm text-muted-foreground">PDF files up to 10MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <Button onClick={handleUpload} disabled={!uploadFile || isSubmitting} className="w-full bg-primary">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload knowledge source"}
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="url" className="space-y-4 mt-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="url">Website URL</Label>
                                            <Input
                                                id="url"
                                                placeholder="https://docs.example.com"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                className="rounded-xl"
                                            />
                                            <p className="text-xs text-muted-foreground">We'll scrape the readable content and strip navigation/ads.</p>
                                        </div>
                                        <Button onClick={handleAddUrl} disabled={!urlInput || isSubmitting} className="w-full bg-primary">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crawl Website"}
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="faq" className="space-y-4 mt-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="faq-name">Source Name</Label>
                                                <Input
                                                    id="faq-name"
                                                    placeholder="e.g. Refund Policy"
                                                    value={faqData.name}
                                                    onChange={(e) => setFaqData({ ...faqData, name: e.target.value })}
                                                    className="rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="question">Question</Label>
                                                <Input
                                                    id="question"
                                                    placeholder="What is your return policy?"
                                                    value={faqData.question}
                                                    onChange={(e) => setFaqData({ ...faqData, question: e.target.value })}
                                                    className="rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="answer">Answer</Label>
                                                <Textarea
                                                    id="answer"
                                                    placeholder="Briefly explain the answer..."
                                                    className="h-24 rounded-xl"
                                                    value={faqData.answer}
                                                    onChange={(e) => setFaqData({ ...faqData, answer: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={handleAddFaq} disabled={!faqData.question || !faqData.answer || isSubmitting} className="w-full bg-primary">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save FAQ"}
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-background/40 border-primary/5 rounded-2xl shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Knowledge Sources</CardDescription>
                        <CardTitle className="text-3xl">{sources.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={Math.min(100, (sources.length / 10) * 100)} className="h-1.5" />
                    </CardContent>
                </Card>
                <Card className="bg-background/40 border-primary/5 rounded-2xl shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Processing Status</CardDescription>
                        <CardTitle className="text-3xl">{sources.filter(s => s.status === "COMPLETED").length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <span className="text-xs text-muted-foreground">{sources.filter(s => s.status === "PROCESSING").length} currently in queue</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/70">Health Score</CardDescription>
                        <CardTitle className="text-3xl">98%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-primary-foreground/80">Excellent data coverage for RAG</p>
                    </CardContent>
                </Card>
            </div>

            {/* Source List */}
            <div className="rounded-2xl border border-primary/5 bg-background/50 backdrop-blur-sm overflow-hidden shadow-xl">
                <div className="p-6 border-b border-primary/5 flex items-center justify-between bg-muted/20">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        Integrated Intelligence
                    </h3>
                </div>

                {sourcesLoading ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                ) : sources.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="border-primary/5 hover:bg-transparent">
                                <TableHead className="w-[40%]">Source Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.map((source) => (
                                <TableRow key={source.id} className="border-primary/5 hover:bg-primary/[0.02] transition-colors group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                {source.type === "FILE" && <FileText className="size-4" />}
                                                {source.type === "URL" && <Globe className="size-4" />}
                                                {source.type === "TEXT" && <MessageSquare className="size-4" />}
                                            </div>
                                            <span className="max-w-[250px] truncate">{source.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal rounded-lg">{source.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(source.status)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(source.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2">
                                                    <ExternalLink className="size-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 text-destructive"
                                                    onClick={() => handleDeleteSource(source.id)}
                                                >
                                                    <Trash2 className="size-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-20 text-center space-y-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto shadow-inner">
                            <Upload className="size-10 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold">Knowledge base is empty</h3>
                            <p className="text-muted-foreground max-w-[400px] mx-auto">
                                Train your AI agent by uploading PDFs, scraping websites, or providing FAQs.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            variant="outline"
                            className="rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
                        >
                            Connect First Source
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
