"use client"

import * as React from "react"
import {
    getBots,
    getDataSources,
    uploadDataSource,
    addUrlDataSource,
    addFaqDataSource,
    deleteDataSource,
    Bot,
    DataSource
} from "@/lib/api-session"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { DataSourceManager } from "@/components/dashboard/data-source-manager"
import { ActiveSourcesList } from "@/components/dashboard/active-sources-list"
import { SourceDetailsDialog } from "@/components/dashboard/source-details-dialog"
import {
    getSourceChunks,
    updateChunk,
    listFaqs,
    updateFaq,
    deleteFaq,
    deleteChunk,
    FAQ,
    DocumentChunk
} from "@/lib/api-session"
import { useSearchParams } from "next/navigation"
import { Bot as BotIcon } from "lucide-react"
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog"

export default function DataSourcesPage() {
    const searchParams = useSearchParams()
    const botIdParam = searchParams.get("botId")

    const [bots, setBots] = React.useState<Bot[]>([])
    const [selectedBotId, setSelectedBotId] = React.useState<string>("")
    const [dataSources, setDataSources] = React.useState<DataSource[]>([])
    const [loading, setLoading] = React.useState(true)
    const [sourcesLoading, setSourcesLoading] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState(false)

    // View/Edit state
    const [viewingSource, setViewingSource] = React.useState<DataSource | null>(null)
    const [sourceContent, setSourceContent] = React.useState<{ chunks: DocumentChunk[], faqs: FAQ[] }>({ chunks: [], faqs: [] })
    const [contentLoading, setContentLoading] = React.useState(false)
    const [itemUpdating, setItemUpdating] = React.useState<string | null>(null)
    const [isDataModalOpen, setIsDataModalOpen] = React.useState(false)

    // Form states
    const [url, setUrl] = React.useState("")
    const [faqName, setFaqName] = React.useState("")
    const [faqs, setFaqs] = React.useState([{ question: "", answer: "" }])
    const [file, setFile] = React.useState<File | null>(null)

    const fetchBots = React.useCallback(async () => {
        try {
            const userBots = await getBots()
            setBots(userBots)

            // Priority: Query param > Current state > First bot
            if (botIdParam && userBots.some(b => b.id === botIdParam)) {
                setSelectedBotId(botIdParam)
            } else if (userBots.length > 0 && !selectedBotId) {
                setSelectedBotId(userBots[0].id)
            }
        } catch (error) {
            console.error("Failed to fetch bots:", error)
            toast.error("Failed to load chatbots")
        } finally {
            setLoading(false)
        }
    }, [selectedBotId, botIdParam])

    React.useEffect(() => {
        void fetchBots()
    }, [fetchBots])

    React.useEffect(() => {
        const fetchSources = async () => {
            if (!selectedBotId) return
            setSourcesLoading(true)
            try {
                const sources = await getDataSources(selectedBotId)
                setDataSources(sources)
            } catch (error) {
                console.error("Failed to fetch sources:", error)
                toast.error("Failed to load data sources")
            } finally {
                setSourcesLoading(false)
            }
        }
        void fetchSources()
    }, [selectedBotId])

    const handleFileUpload = async () => {
        if (!selectedBotId || !file) return false
        setActionLoading(true)
        try {
            const success = await uploadDataSource(selectedBotId, file)
            if (success) {
                toast.success("File uploaded and processed successfully")
                setFile(null)
                // Refresh sources
                const sources = await getDataSources(selectedBotId)
                setDataSources(sources)
                return true
            } else {
                toast.error("Failed to upload file")
                return false
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("An error occurred during upload")
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const handleUrlAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBotId || !url) return false
        setActionLoading(true)
        try {
            const success = await addUrlDataSource(selectedBotId, url)
            if (success) {
                toast.success("Website synchronized successfully")
                setUrl("")
                // Refresh sources
                const sources = await getDataSources(selectedBotId)
                setDataSources(sources)
                return true
            } else {
                toast.error("Failed to sync website")
                return false
            }
        } catch (error) {
            console.error("URL error:", error)
            toast.error("An error occurred during URL sync")
            return false
        } finally {
            setActionLoading(false)
        }
    }
    const handleFaqAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBotId || !faqName || faqs.some(f => !f.question || !f.answer)) {
            toast.error("Please fill in all FAQ fields")
            return false
        }
        setActionLoading(true)
        try {
            const success = await addFaqDataSource(selectedBotId, faqName, faqs)
            if (success) {
                toast.success("FAQs added successfully")
                setFaqName("")
                setFaqs([{ question: "", answer: "" }])
                // Refresh sources
                const sources = await getDataSources(selectedBotId)
                setDataSources(sources)
                return true
            } else {
                toast.error("Failed to add FAQs")
                return false
            }
        } catch (error) {
            console.error("FAQ error:", error)
            toast.error("An error occurred adding FAQs")
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (dsId: string) => {
        if (!confirm("Are you sure you want to delete this data source?")) return
        try {
            const success = await deleteDataSource(dsId)
            if (success) {
                setDataSources(prev => prev.filter(ds => ds.id !== dsId))
                if (viewingSource?.id === dsId) setViewingSource(null)
                toast.success("Data source removed")
            } else {
                toast.error("Failed to delete")
            }
        } catch {
            toast.error("An error occurred during deletion")
        }
    }

    const handleViewDetails = async (source: DataSource) => {
        setViewingSource(source)
        setContentLoading(true)
        try {
            if (source.type === "TEXT") {
                const allFaqs = await listFaqs(selectedBotId)
                const sourceFaqs = allFaqs.filter(f => f.sourceId === source.id)
                setSourceContent({ chunks: [], faqs: sourceFaqs })
            } else {
                const chunks = await getSourceChunks(source.id)
                setSourceContent({ chunks: chunks, faqs: [] })
            }
        } catch (error) {
            console.error("Failed to load content:", error)
            toast.error("Failed to load source content")
        } finally {
            setContentLoading(false)
        }
    }

    const handleUpdateChunk = async (chunkId: string, newContent: string) => {
        setItemUpdating(chunkId)
        try {
            const updated = await updateChunk(chunkId, newContent)
            if (updated) {
                setSourceContent(prev => ({
                    ...prev,
                    chunks: prev.chunks.map(c => c.id === chunkId ? updated : c)
                }))
                toast.success("Content updated")
            }
        } catch {
            toast.error("Failed to update content")
        } finally {
            setItemUpdating(null)
        }
    }

    const handleDeleteChunk = async (chunkId: string) => {
        if (!confirm("Delete this text segment?")) return
        try {
            const success = await deleteChunk(chunkId)
            if (success) {
                setSourceContent(prev => ({
                    ...prev,
                    chunks: prev.chunks.filter(c => c.id !== chunkId)
                }))
                toast.success("Segment removed")
            }
        } catch {
            toast.error("Failed to delete segment")
        }
    }

    const handleUpdateFaq = async (faqId: string, question: string, answer: string) => {
        setItemUpdating(faqId)
        try {
            const updated = await updateFaq(faqId, { question, answer })
            if (updated) {
                setSourceContent(prev => ({
                    ...prev,
                    faqs: prev.faqs.map(f => f.id === faqId ? updated : f)
                }))
                toast.success("FAQ updated")
            }
        } catch {
            toast.error("Failed to update FAQ")
        } finally {
            setItemUpdating(null)
        }
    }

    const handleDeleteFaq = async (faqId: string) => {
        if (!confirm("Delete this FAQ entry?")) return
        try {
            const success = await deleteFaq(faqId)
            if (success) {
                setSourceContent(prev => ({
                    ...prev,
                    faqs: prev.faqs.filter(f => f.id !== faqId)
                }))
                toast.success("FAQ removed")
            }
        } catch {
            toast.error("Failed to delete FAQ")
        }
    }

    const addFaqField = () => setFaqs([...faqs, { question: "", answer: "" }])
    const removeFaqField = (index: number) => {
        if (faqs.length > 1) {
            setFaqs(faqs.filter((_, i) => i !== index))
        }
    }
    const updateFaqField = (index: number, field: "question" | "answer", value: string) => {
        const newFaqs = [...faqs]
        newFaqs[index][field] = value
        setFaqs(newFaqs)
    }

    if (loading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-10 w-64" />
                <div className="grid lg:grid-cols-2 gap-8">
                    <Skeleton className="h-125" />
                    <Skeleton className="h-125" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 w-full p-6 lg:p-10 space-y-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">Data Sources</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            Connect your documents, websites, and FAQs to train your AI agents.
                        </p>
                    </div>
                    {bots.length > 0 && (
                        <div className="shrink-0">
                            <DataSourceManager
                                bots={bots}
                                selectedBotId={selectedBotId}
                                onSelectedBotIdChange={setSelectedBotId}
                                loading={loading}
                                actionLoading={actionLoading}
                                file={file}
                                onFileChange={setFile}
                                onFileUpload={handleFileUpload}
                                url={url}
                                onUrlChange={setUrl}
                                onUrlSubmit={handleUrlAdd}
                                faqName={faqName}
                                onFaqNameChange={setFaqName}
                                faqs={faqs}
                                onFaqSubmit={handleFaqAdd}
                                onAddFaqField={addFaqField}
                                onRemoveFaqField={removeFaqField}
                                onUpdateFaqField={updateFaqField}
                                onAgentCreated={fetchBots}
                                isDataModalOpen={isDataModalOpen}
                                setIsDataModalOpen={setIsDataModalOpen}
                                hasDataSources={dataSources.length > 0}
                            />
                        </div>
                    )}
                </div>

                {bots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/40 bg-muted/5 min-h-[400px]">
                        <div className="size-20 bg-primary/10 flex items-center justify-center mb-6">
                            <BotIcon className="size-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">No Chatbots Detected</h2>
                        <p className="text-muted-foreground text-center max-w-md mb-8">
                            You need to create at least one chatbot agent before you can connect data sources. Data is added specifically to an individual agent.
                        </p>
                        <CreateAgentDialog onSuccess={fetchBots} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        <div className="flex-1">
                            <ActiveSourcesList
                                dataSources={dataSources}
                                sourcesLoading={sourcesLoading}
                                onViewDetails={handleViewDetails}
                                onDelete={handleDelete}
                                onAddSource={() => setIsDataModalOpen(true)}
                            />
                        </div>
                    </div>
                )}
            </main>

            <SourceDetailsDialog
                source={viewingSource}
                onClose={() => setViewingSource(null)}
                content={sourceContent}
                contentLoading={contentLoading}
                itemUpdating={itemUpdating}
                onUpdateChunk={handleUpdateChunk}
                onDeleteChunk={handleDeleteChunk}
                onUpdateFaq={handleUpdateFaq}
                onDeleteFaq={handleDeleteFaq}
            />
        </div>
    )
}
