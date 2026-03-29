"use client"

import * as React from "react"
import { Search, Grid, List, MoreVertical, Settings2, Trash2, Rocket, Plus, Bot } from "lucide-react"
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
        <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-100 dark:border-zinc-800 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Chatbot Agents</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your AI assistants, monitor their performance, and update their configurations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateBotDialog onSuccess={fetchBots} />
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, engine, or model..."
                        className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-9 w-9", view === "grid" ? "bg-white dark:bg-zinc-800 shadow-sm" : "")}
                        onClick={() => setView("grid")}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-9 w-9", view === "list" ? "bg-white dark:bg-zinc-800 shadow-sm" : "")}
                        onClick={() => setView("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1")}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-zinc-200 dark:border-zinc-800 h-[220px]">
                            <CardHeader>
                                <Skeleton className="h-6 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredBots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10">
                    <div className="relative mb-6">
                        <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Bot className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white dark:bg-zinc-950 rounded-full flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-800">
                            <Rocket className="h-5 w-5 text-zinc-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No chatbots found</h3>
                    <p className="text-muted-foreground mt-2 text-center max-w-xs px-4">
                        {searchQuery ? "Try adjusting your search filters." : "You haven't created any chatbot agents yet. Launch your first one today!"}
                    </p>
                    {!searchQuery && (
                        <div className="mt-8">
                            <CreateBotDialog onSuccess={fetchBots} />
                        </div>
                    )}
                </div>
            ) : view === "grid" ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {filteredBots.map((bot) => (
                        <ChatBotCard key={bot.id} bot={bot} fetchBots={fetchBots} onDelete={() => handleDelete(bot.id)} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredBots.map((bot) => (
                        <ChatBotRow key={bot.id} bot={bot} fetchBots={fetchBots} onDelete={() => handleDelete(bot.id)} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ChatBotCard({ bot, fetchBots, onDelete }: { bot: ChatBot, fetchBots: () => void, onDelete: () => void }) {
    return (
        <CreateBotDialog
            bot={bot}
            onSuccess={fetchBots}
            trigger={
                <Card className="group relative overflow-hidden transition-all hover:shadow-xl dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50 backdrop-blur-sm cursor-pointer">
                    <div
                        className="absolute top-0 right-0 p-4 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                <CreateBotDialog
                                    bot={bot}
                                    onSuccess={fetchBots}
                                    trigger={
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer">
                                            <Settings2 className="h-4 w-4" /> Update Settings
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4" /> Delete Agent
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/30">
                                <div className="relative h-6 w-6">
                                    <Image
                                        src={engineLogos[bot.engine] || "/brandLogo/openai.svg"}
                                        alt={bot.engine}
                                        fill
                                        className={cn("object-contain", bot.engine !== "google" && "dark:invert")}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <CardTitle className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {bot.name}
                                </CardTitle>
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 w-fit mt-1.5 shadow-sm group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 group-hover:border-blue-200/50 dark:group-hover:border-blue-800/30 transition-all duration-300">
                                    <div className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 uppercase tracking-[0.05em] leading-none">
                                        {bot.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-6">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                            {bot.description || "No description provided for this AI assistant."}
                        </p>
                    </CardContent>
                </Card>
            }
        />
    )
}

function ChatBotRow({ bot, fetchBots, onDelete }: { bot: ChatBot, fetchBots: () => void, onDelete: () => void }) {
    return (
        <CreateBotDialog
            bot={bot}
            onSuccess={fetchBots}
            trigger={
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-700 transition-all">
                            <div className="relative h-7 w-7">
                                <Image
                                    src={engineLogos[bot.engine] || "/brandLogo/openai.svg"}
                                    alt={bot.engine}
                                    fill
                                    className={cn("object-contain", bot.engine !== "google" && "dark:invert")}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h4 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{bot.name}</h4>
                            <div className="flex items-center gap-2.5 mt-1.5 px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/50 w-fit shadow-xs group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-all">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-widest leading-none">{bot.engine}</span>
                                <span className="h-0.5 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wide leading-none">{bot.type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground focus-visible:ring-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
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
            }
        />
    )
}
