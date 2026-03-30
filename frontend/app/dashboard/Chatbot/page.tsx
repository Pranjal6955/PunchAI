"use client"

import * as React from "react"
import { Search, Grid, List, MoreVertical, Settings2, Trash2, Rocket, Plus, Bot, Database, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateBotDialog } from "@/components/chatbot/create-bot-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatBot {
    id: string
    name: string
    description: string | null
    engine: string
    type: string
    createdAt: string
}

const engineLogos: Record<string, string> = {
    google: "/brandLogo/gemini-color.svg",
    openai: "/brandLogo/openai.svg",
    anthropic: "/brandLogo/anthropic.svg",
}

export default function ChatbotPage() {
    const [bots, setBots] = React.useState<ChatBot[]>([])
    const [loading, setLoading] = React.useState(true)
    const [view, setView] = React.useState<"grid" | "list">("grid")
    const [searchQuery, setSearchQuery] = React.useState("")

    const fetchBots = React.useCallback(async () => {
        try {
            setLoading(true)
            const data = await api.get("/bots/")
            setBots(data)
        } catch (error) {
            console.error("Failed to fetch bots:", error)
            toast.error("Failed to load your chatbots")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchBots()
    }, [fetchBots])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this chatbot?")) return

        try {
            await api.delete(`/bots/${id}`)
            toast.success("Chatbot deleted successfully")
            fetchBots()
        } catch (error) {
            toast.error("Failed to delete chatbot")
        }
    }

    const filteredBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.engine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500 pb-10 px-6 sm:px-8 max-w-[1600px] mx-auto">
            {/* Simple Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chatbot Agents</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Manage your AI assistants and their specific knowledge bases.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateBotDialog onSuccess={fetchBots} />
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by name or engine..."
                        className="pl-9 h-10 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", view === "grid" ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-muted-foreground")}
                        onClick={() => setView("grid")}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", view === "list" ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-muted-foreground")}
                        onClick={() => setView("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            ) : filteredBots.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed rounded-2xl flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4">
                        <Bot className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-lg">No Agents Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">{searchQuery ? "No matches for your search query." : "Create your first chatbot agent to get started."}</p>
                </div>
            ) : (
                <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                    {filteredBots.map((bot) => (
                        <ChatBotCard key={bot.id} bot={bot} fetchBots={fetchBots} onDelete={() => handleDelete(bot.id)} view={view} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ChatBotCard({ bot, fetchBots, onDelete, view }: { bot: ChatBot, fetchBots: () => void, onDelete: () => void, view: "grid" | "list" }) {
    if (view === "list") {
        return (
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm group">
                <div className="flex flex-row items-center p-4 gap-6">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-900 border flex items-center justify-center">
                        <div className="relative h-6 w-6">
                            <Image
                                src={engineLogos[bot.engine] || "/brandLogo/openai.svg"}
                                alt={bot.engine}
                                fill
                                className={cn("object-contain", bot.engine !== "google" && "dark:invert")}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate">{bot.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="h-5 text-[10px] font-bold uppercase tracking-wide">
                                {bot.engine}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {bot.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/dataSource?botId=${bot.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-2">
                                <Database className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Knowledge</span>
                            </Button>
                        </Link>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <CreateBotDialog
                                    bot={bot}
                                    onSuccess={fetchBots}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer">
                                            <Settings2 className="h-4 w-4" /> Config
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm group p-6 gap-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border flex items-center justify-center shrink-0">
                        <div className="relative h-5 w-5">
                            <Image
                                src={engineLogos[bot.engine] || "/brandLogo/openai.svg"}
                                alt={bot.engine}
                                fill
                                className={cn("object-contain", bot.engine !== "google" && "dark:invert")}
                            />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-base truncate leading-none">{bot.name}</h4>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 block">
                            {bot.engine} • {bot.type}
                        </span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <CreateBotDialog
                            bot={bot}
                            onSuccess={fetchBots}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer">
                                    <Settings2 className="h-4 w-4" /> Settings
                                </DropdownMenuItem>
                            }
                        />
                        <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {bot.description || "No specific instructions provided for this AI agent."}
            </p>

            <div className="flex items-center gap-3 mt-auto">
                <Link href={`/dashboard/dataSource?botId=${bot.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2 bg-transparent">
                        <Database className="h-3 w-3" /> Data
                    </Button>
                </Link>
                <CreateBotDialog
                    bot={bot}
                    onSuccess={fetchBots}
                    trigger={
                        <Button variant="secondary" size="sm" className="flex-1 text-xs h-8 gap-2">
                            <Settings2 className="h-3 w-3" /> Config
                        </Button>
                    }
                />
            </div>
        </Card>
    )
}
