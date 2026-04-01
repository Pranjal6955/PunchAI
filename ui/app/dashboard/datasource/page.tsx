"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Database,
    Plus,
    Search,
    FileText,
    Link as LinkIcon,
    MessageSquare,
    Trash2,
    Loader2,
    Globe,
    UploadCloud,
    ChevronLeft,
    Bot,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { botApi, datasourceApi, authApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function DataSourcePage() {
    const [bots, setBots] = useState<any[]>([])
    const [selectedBot, setSelectedBot] = useState<any>(null)
    const [sources, setSources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sourcesLoading, setSourcesLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Form States
    const [url, setUrl] = useState("")
    const [isAddingUrl, setIsAddingUrl] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // FAQ Form State
    const [faqName, setFaqName] = useState("")
    const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([{ question: "", answer: "" }])
    const [isAddingFaq, setIsAddingFaq] = useState(false)

    useEffect(() => {
        const fetchBots = async () => {
            try {
                setLoading(true)
                const profile = await authApi.getProfile()
                const botsRes = await botApi.list({ ownerId: profile.id })
                setBots(botsRes.data || [])
            } catch (err) {
                console.error("Fetch bots error:", err)
                toast.error("Failed to load bots")
            } finally {
                setLoading(false)
            }
        }
        fetchBots()
    }, [])

    useEffect(() => {
        if (selectedBot) {
            fetchSources()
        }
    }, [selectedBot])

    const fetchSources = async () => {
        if (!selectedBot) return
        try {
            setSourcesLoading(true)
            const res = await datasourceApi.list(selectedBot.id)
            setSources(res.data || [])
        } catch (err) {
            console.error("Fetch sources error:", err)
            toast.error("Failed to load data sources")
        } finally {
            setSourcesLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedBot) return

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error("Only PDF files are supported")
            return
        }

        try {
            setIsUploading(true)
            await datasourceApi.uploadFile(selectedBot.id, file)
            toast.success(`${file.name} uploaded and is being processed`)
            fetchSources() // Fetch straight away 

            // Poll for completion after 2 seconds
            setTimeout(fetchSources, 3000)
        } catch (err: any) {
            console.error("Upload error:", err)
            toast.error(err.message || "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleAddUrl = async () => {
        if (!url || !selectedBot) return
        try {
            setIsAddingUrl(true)
            await datasourceApi.addUrl(selectedBot.id, url)
            toast.success("URL added and is being scraped")
            setUrl("")
            fetchSources()
            setTimeout(fetchSources, 4000)
        } catch (err: any) {
            console.error("Add URL error:", err)
            toast.error(err.message || "Failed to add URL")
        } finally {
            setIsAddingUrl(false)
        }
    }

    const handleAddFaq = async () => {
        if (!faqName || !selectedBot || faqs.some(f => !f.question || !f.answer)) {
            toast.error("Please fill in all FAQ fields")
            return
        }
        try {
            setIsAddingFaq(true)
            await datasourceApi.addFaqs(selectedBot.id, faqName, faqs)
            toast.success("FAQs added successfully")
            setFaqName("")
            setFaqs([{ question: "", answer: "" }])
            fetchSources()
        } catch (err: any) {
            console.error("Add FAQ error:", err)
            toast.error(err.message || "Failed to add FAQs")
        } finally {
            setIsAddingFaq(false)
        }
    }

    const deleteSource = async (id: string) => {
        if (!confirm("Are you sure you want to delete this data source? Changes are irreversible.")) return
        try {
            await datasourceApi.delete(id)
            setSources(sources.filter(s => s.id !== id))
            toast.success("Source deleted")
        } catch (err) {
            console.error("Delete source error:", err)
            toast.error("Delete failed")
        }
    }

    const filteredBots = bots.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Main View: Bot Selection
    if (!selectedBot) {
        return (
            <div className="flex flex-col gap-8 animate-in fade-in duration-700">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Data Sources</h1>
                    <p className="text-muted-foreground text-balance max-w-2xl">
                        Power your AI agents with custom knowledge. Select a bot to start uploading PDFs, scraping websites, or managing FAQs.
                    </p>
                </div>

                <div className="relative group max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search your bots..."
                        className="pl-10 bg-background/50 border-primary/5 focus-visible:ring-primary/40 focus-visible:ring-offset-0 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[220px] w-full rounded-3xl" />)}
                    </div>
                ) : filteredBots.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredBots.map((bot) => (
                            <Card
                                key={bot.id}
                                className="group relative cursor-pointer overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-primary/10 hover:border-primary/40 rounded-3xl group"
                                onClick={() => setSelectedBot(bot)}
                            >
                                <CardHeader className="relative pb-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 mb-4 shadow-sm">
                                        <Bot className="size-6" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{bot.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1 h-10">{bot.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-4 pt-6 border-t border-primary/5">
                                    <Button variant="ghost" className="w-full text-xs font-bold gap-2 group-hover:bg-primary/10 group-hover:text-primary transition-all rounded-xl py-6">
                                        Manage Knowledge <ChevronLeft className="size-3 rotate-180 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center border-2 border-dashed rounded-[3rem] border-primary/5 bg-muted/5">
                        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center shadow-inner">
                            <Bot className="size-10 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">No bots found</h3>
                            <p className="text-muted-foreground max-w-xs">{searchQuery ? `We couldn't find any bots matching "${searchQuery}"` : "You haven't created any AI agents yet."}</p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Secondary View: Manage Data for selected bot
    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBot(null)}
                        className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-colors border border-primary/5"
                    >
                        <ChevronLeft className="size-6" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tight">{selectedBot.name}</h1>
                            <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-none text-[10px] uppercase font-black px-2 mt-1">Active</Badge>
                        </div>
                        <p className="text-muted-foreground font-semibold flex items-center gap-2 text-sm italic">
                            Building knowledge base for your AI assistant
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                {/* Add Data Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-xl">
                        <CardHeader className="bg-primary/5 border-b border-primary/5 pb-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="size-5 text-primary" />
                                Add Intelligence
                            </CardTitle>
                            <CardDescription className="font-medium">Train your bot with specialized data.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <Tabs defaultValue="file" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/40 p-1.5 rounded-2xl h-14">
                                    <TabsTrigger value="file" className="rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-background transition-all font-bold">
                                        <FileText className="size-4 mr-2" />File
                                    </TabsTrigger>
                                    <TabsTrigger value="url" className="rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-background transition-all font-bold">
                                        <Globe className="size-4 mr-2" />URL
                                    </TabsTrigger>
                                    <TabsTrigger value="faq" className="rounded-xl data-[state=active]:shadow-lg data-[state=active]:bg-background transition-all font-bold">
                                        <MessageSquare className="size-4 mr-1 md:mr-2" />FAQ
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="file" className="space-y-6 mt-0">
                                    <div className="border-3 border-dashed border-primary/15 rounded-3xl p-12 text-center bg-primary/[0.02] hover:bg-primary/[0.05] transition-all relative group shadow-inner">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <div className="flex flex-col items-center gap-5">
                                            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-primary/10">
                                                {isUploading ? <Loader2 className="size-8 animate-spin" /> : <UploadCloud className="size-8" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">Click or Drag PDF</p>
                                                <p className="text-xs text-muted-foreground font-semibold mt-1">Recommended for documents & whitepapers.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 text-blue-600 rounded-2xl border border-blue-500/10">
                                        <AlertCircle className="size-4" />
                                        <p className="text-[10px] font-bold">Only PDF files up to 10MB are currently supported.</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="url" className="space-y-4 mt-0">
                                    <div className="space-y-3">
                                        <Label htmlFor="url" className="font-bold ml-1">Knowledge Source URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="url"
                                                placeholder="https://docs.yourcompany.com"
                                                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary/40 px-5"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                            />
                                            <Button
                                                onClick={handleAddUrl}
                                                disabled={isAddingUrl || !url}
                                                className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20"
                                            >
                                                {isAddingUrl ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold px-1 italic">Our crawler will visit this page and extract the relevant text for indexing.</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="faq" className="space-y-6 mt-0">
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1 text-xs uppercase tracking-widest text-primary">FAQ Set Name</Label>
                                            <Input
                                                placeholder="e.g. Service Q&A"
                                                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus-visible:ring-primary/40 px-5"
                                                value={faqName}
                                                onChange={(e) => setFaqName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-5 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-2">
                                            {faqs.map((faq, i) => (
                                                <div key={i} className="space-y-3 p-5 border-2 border-primary/5 rounded-3xl bg-background shadow-sm relative group animate-in zoom-in-95 duration-300">
                                                    {faqs.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border-2 border-primary/5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                                            onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    )}
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Question</Label>
                                                        <Input
                                                            placeholder="What is your return policy?"
                                                            value={faq.question}
                                                            onChange={(e) => {
                                                                const newFaqs = [...faqs]
                                                                newFaqs[i].question = e.target.value
                                                                setFaqs(newFaqs)
                                                            }}
                                                            className="text-xs h-10 rounded-xl bg-muted/20 border-none focus-visible:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Detailed Answer</Label>
                                                        <Textarea
                                                            placeholder="We offer a 30-day money back guarantee..."
                                                            value={faq.answer}
                                                            onChange={(e) => {
                                                                const newFaqs = [...faqs]
                                                                newFaqs[i].answer = e.target.value
                                                                setFaqs(newFaqs)
                                                            }}
                                                            className="text-xs min-h-[80px] rounded-xl bg-muted/20 border-none focus-visible:ring-primary/20 resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-2xl h-12 border-primary/10 hover:bg-primary/5 hover:border-primary/20 font-bold"
                                                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                                            >
                                                Add Couple
                                            </Button>
                                            <Button
                                                className="flex-1 rounded-2xl h-12 shadow-xl shadow-primary/20 font-bold"
                                                onClick={handleAddFaq}
                                                disabled={isAddingFaq || !faqName || faqs.some(f => !f.question || !f.answer)}
                                            >
                                                {isAddingFaq ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
                                                Save Intelligence
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Sources List */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0 mb-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl font-black flex items-center gap-3">
                                    <Database className="size-6 text-primary" />
                                    Active Knowledge
                                </CardTitle>
                                {sources.length > 0 && (
                                    <Badge variant="outline" className="rounded-lg h-7 font-bold border-primary/20 bg-primary/5 text-primary">
                                        {sources.length} Total Sources
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="font-semibold italic">A real-time overview of your bot's brain components.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            {sourcesLoading ? (
                                <div className="space-y-6">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)}
                                </div>
                            ) : sources.length > 0 ? (
                                <div className="grid gap-5">
                                    {sources.map((source) => (
                                        <div key={source.id} className="group flex items-center justify-between p-6 border-2 border-primary/5 rounded-[2rem] bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
                                            <div className="flex items-center gap-6">
                                                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm border border-current/10 ${source.type === 'FILE' ? 'bg-blue-500/10 text-blue-600' :
                                                    source.type === 'URL' ? 'bg-purple-500/10 text-purple-600' :
                                                        'bg-green-500/10 text-green-600'
                                                    }`}>
                                                    {source.type === 'FILE' ? <FileText className="size-7" /> :
                                                        source.type === 'URL' ? <Globe className="size-7" /> :
                                                            <MessageSquare className="size-7" />}
                                                </div>
                                                <div className="space-y-1.5 py-1">
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-black text-lg tracking-tight group-hover:text-primary transition-colors">
                                                            {source.name}
                                                        </p>
                                                        {source.status === 'COMPLETED' ? (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase">
                                                                <CheckCircle2 className="size-3" /> Ready
                                                            </div>
                                                        ) : source.status === 'PROCESSING' ? (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">
                                                                <Loader2 className="size-3 animate-spin" /> Indexing
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase">
                                                                <AlertCircle className="size-3" /> Error
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-5 text-xs text-muted-foreground font-black tracking-wide">
                                                        <span className="flex items-center gap-1.5 opacity-60"><Clock className="size-3" /> {new Date(source.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-muted rounded-lg tracking-tighter text-[9px] border border-primary/5 uppercase">{source.type} SOURCE</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 rounded-2xl text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20 h-11 w-11"
                                                    onClick={() => deleteSource(source.id)}
                                                >
                                                    <Trash2 className="size-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-[450px] flex-col items-center justify-center gap-5 border-2 border-dashed rounded-[3rem] bg-muted/5 opacity-80 border-primary/5 text-center px-10">
                                    <div className="h-24 w-24 rounded-full bg-muted shadow-inner flex items-center justify-center">
                                        <Database className="size-10 text-muted-foreground/30 animate-pulse" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-muted-foreground/60 tracking-tight">Empty Knowledge Base</p>
                                        <p className="text-sm text-muted-foreground max-w-xs font-semibold">Start adding PDFs, Links or FAQs to breathe life into your AI agent's consciousness.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
