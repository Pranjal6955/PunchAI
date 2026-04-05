"use client"

import { useState, useEffect, useMemo } from "react"
import {
    getBots,
    getDataSources,
    Bot,
    DataSource,
    deleteDataSource
} from "@/lib/api-session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Globe,
    FileText,
    Plus,
    Trash2,
    Search,
    Loader2,
    RefreshCcw,
    Database,
    HelpCircle,
    Clock,
    ArrowRight,
    Bot as BotIcon,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { AddSourceDialog } from "@/components/datasource/add-source-dialog"
import Link from "next/link"

export default function DataSourcesPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>("all");
    const [sources, setSources] = useState<(DataSource & { botName: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const fetchedBots = await getBots();
            setBots(fetchedBots);
            await fetchSources(selectedBotId === "all" ? undefined : selectedBotId, fetchedBots);
        } catch (error) {
            toast.error("Failed to load data sources");
        } finally {
            setLoading(false);
        }
    };

    const fetchSources = async (botId?: string, currentBots?: Bot[]) => {
        setRefreshing(true);
        try {
            const activeBots = currentBots || bots;
            if (activeBots.length === 0) {
                setSources([]);
                return;
            }
            const botsToFetch = botId ? activeBots.filter(b => b.id === botId) : activeBots;

            const results = await Promise.all(
                botsToFetch.map(async (bot) => {
                    const botSources = await getDataSources(bot.id);
                    return botSources.map(s => ({ ...s, botName: bot.name }));
                })
            );

            const allSources = results.flat().sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setSources(allSources);
        } catch (error) {
            console.error("Fetch sources error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this data source? This will remove all associated knowledge from the AI model.")) {
            return;
        }

        try {
            const success = await deleteDataSource(id);
            if (success) {
                toast.success("Data source removed successfully");
                setSources(sources.filter(s => s.id !== id));
            } else {
                toast.error("Failed to delete data source");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    const filteredSources = useMemo(() => {
        return sources.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sources, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: sources.length,
            files: sources.filter(s => s.type === "FILE").length,
            urls: sources.filter(s => s.type === "URL").length,
            faqs: sources.filter(s => s.type === "TEXT").length,
        };
    }, [sources]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "FILE": return <FileText className="h-4 w-4" />;
            case "URL": return <Globe className="h-4 w-4" />;
            case "TEXT": return <HelpCircle className="h-4 w-4" />;
            default: return <Database className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
            case "PROCESSING": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "FAILED": return "bg-destructive/10 text-destructive border-destructive/20";
            default: return "bg-muted text-muted-foreground";
        }
    };

    if (loading) {
        return (
            <div className="p-6 lg:p-8 space-y-8 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-64 rounded-none" />
                        <Skeleton className="h-4 w-96 rounded-none" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-none" />)}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-none" />
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-none" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 w-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Data Sources</h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mt-2 leading-relaxed">
                        Manage your knowledge base by importing documents, links, and FAQs into your AI agents.
                    </p>
                </div>

                {bots.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/10 p-1 border border-border/40 backdrop-blur-sm">
                        <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                            <SelectTrigger className="w-full md:w-[220px] rounded-none border-0 bg-background shadow-none h-10 text-[10px] uppercase font-bold tracking-widest border border-border/20">
                                <BotIcon className="mr-2 h-4 w-4 opacity-70" />
                                <SelectValue placeholder="Select Chatbot" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-border/60">
                                <SelectItem value="all" className="text-[10px] uppercase font-bold tracking-widest">All Chatbots</SelectItem>
                                {bots.map(bot => (
                                    <SelectItem key={bot.id} value={bot.id} className="text-[10px] uppercase font-bold tracking-widest">{bot.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none hover:bg-muted h-10 w-10 border border-border/20 flex-shrink-0"
                                onClick={() => fetchSources(selectedBotId === "all" ? undefined : selectedBotId)}
                                disabled={refreshing}
                            >
                                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            </Button>

                            {selectedBotId !== "all" ? (
                                <AddSourceDialog
                                    botId={selectedBotId}
                                    onSuccess={() => fetchSources(selectedBotId === "all" ? undefined : selectedBotId)}
                                />
                            ) : (
                                <Button disabled className="rounded-none shadow-none opacity-50 bg-muted text-muted-foreground border border-border/20">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Select Bot to Add
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {bots.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent rounded-none shadow-none mt-12 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="h-24 w-24 rounded-none bg-muted/40 border border-border/60 flex items-center justify-center mb-8">
                            <BotIcon className="h-12 w-12 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight">No Chatbots Available</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-3 mb-12 text-lg">
                            Knowledge sources must belong to an AI agent. Create your first chatbot to start building its knowledge base.
                        </p>
                        <Link href="/dashboard/chatbots">
                            <Button className="rounded-none px-10 h-14 text-base font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                <Plus className="mr-3 h-6 w-6" />
                                Create Your First Chatbot
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Quick Stats */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="rounded-none border-border/60 shadow-none bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Total Sources</CardTitle>
                                <Database className="h-4 w-4 text-primary/60" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tabular-nums tracking-tighter">{stats.total}</div>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold tracking-tight">Across all bots</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-none border-border/60 shadow-none bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Documents</CardTitle>
                                <FileText className="h-4 w-4 text-primary/60" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tabular-nums tracking-tighter">{stats.files}</div>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold tracking-tight">PDF & Text files</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-none border-border/60 shadow-none bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Live URLs</CardTitle>
                                <Globe className="h-4 w-4 text-primary/60" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tabular-nums tracking-tighter">{stats.urls}</div>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold tracking-tight">Scraped web links</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-none border-border/60 shadow-none bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">Dataset FAQs</CardTitle>
                                <HelpCircle className="h-4 w-4 text-primary/60" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tabular-nums tracking-tighter">{stats.faqs}</div>
                                <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold tracking-tight">Manual Q&A datasets</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-1.5 bg-muted/20 border border-border/40 backdrop-blur-sm">
                        <div className="relative w-full lg:max-w-xl group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                placeholder="Search sources by name, bot, or type..."
                                className="pl-11 h-12 rounded-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 transition-all font-medium text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto px-2">
                            <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Context:</p>
                            <div className="px-3 py-1.5 bg-background border border-border/40 text-[10px] font-black uppercase tracking-widest">
                                {selectedBotId === "all" ? "Whole Workspace" : bots.find(b => b.id === selectedBotId)?.name}
                            </div>
                        </div>
                    </div>

                    {/* Sources List */}
                    <div className="space-y-0 border border-border/60 bg-card/10 backdrop-blur-md overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-muted/10">
                            <div className="col-span-5">Source Information</div>
                            <div className="col-span-2">Chatbot Agent</div>
                            <div className="col-span-2">Sync Status</div>
                            <div className="col-span-2">Last Updated</div>
                            <div className="col-span-1 text-right">Action</div>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredSources.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-32 text-center space-y-6"
                                >
                                    <div className="h-20 w-20 bg-muted/20 border border-border/40 rounded-none flex items-center justify-center">
                                        <Database className="h-10 w-10 text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold tracking-tight">No data sources match</h3>
                                        <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                                            {searchQuery ? "Try adjusting your search terms or filters." : "Start by importing files or links to build your knowledge base."}
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                filteredSources.map((source, index) => (
                                    <motion.div
                                        key={source.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.3, delay: index * 0.02 }}
                                        className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all items-center group relative overflow-hidden"
                                    >
                                        <div className="col-span-5 flex items-center gap-6">
                                            <div className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-none bg-primary/5 text-primary/60 border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500`}>
                                                {getTypeIcon(source.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-base truncate group-hover:text-primary transition-colors pr-6 tracking-tight">
                                                    {source.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest font-black py-0 px-1.5 border-border/60 bg-muted/20">
                                                        {source.type}
                                                    </Badge>
                                                    {source.fileUrl && (
                                                        <a href={source.fileUrl} target="_blank" rel="noreferrer" className="text-primary/70 hover:text-primary hover:underline text-[10px] flex items-center gap-1 font-bold underline-offset-2">
                                                            View Raw <ExternalLink className="h-2.5 w-2.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2.5 text-sm text-foreground/80 font-bold tracking-tight">
                                                <BotIcon className="h-4 w-4 text-primary/40" />
                                                {source.botName}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <Badge
                                                variant="outline"
                                                className={`rounded-none text-[9px] font-black uppercase tracking-widest px-3 py-1.5 flex w-fit items-center gap-2 border-0 ${getStatusColor(source.status)}`}
                                            >
                                                {source.status === "COMPLETED" && <ShieldCheck className="h-3 w-3" />}
                                                {source.status === "PROCESSING" && <Loader2 className="h-3 w-3 animate-spin" />}
                                                {source.status === "FAILED" && <AlertCircle className="h-3 w-3" />}
                                                {source.status}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2.5 text-xs text-muted-foreground/80 font-bold tabular-nums">
                                            <Clock className="h-4 w-4 opacity-40" />
                                            {format(new Date(source.createdAt), "MMM d, yyyy")}
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-none text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                                onClick={() => handleDelete(source.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Info Footer */}
            <section className="bg-primary/5 p-8 border border-primary/10 rounded-none relative overflow-hidden mt-12 group">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 justify-between">
                    <div className="space-y-3 text-center lg:text-left max-w-xl">
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Supercharge your AI knowledge base</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Need to automate data ingestion? Use our robust API to push live updates directly to your chatbot's brain in real-time.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-none border-primary/20 hover:border-primary px-10 h-14 bg-background shadow-none group/api text-base font-bold transition-all hover:bg-primary hover:text-primary-foreground">
                        Read API Documentation <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover/api:translate-x-1.5" />
                    </Button>
                </div>
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-primary/10 blur-[120px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />
            </section>
        </div>
    )
}
