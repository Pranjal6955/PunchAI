"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Bot,
    Plus,
    Search,
    MoreVertical,
    MessageSquare,
    Settings,
    Trash2,
    Loader2,
    Send,
    User,
    ChevronLeft,
    Sparkles,
    Eye,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { botApi, authApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function ChatbotPage() {
    const router = useRouter()
    const [bots, setBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // New Bot Form State
    const [newBot, setNewBot] = useState({
        name: "",
        description: "",
        botPersona: "",
    })

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true)
                const profile = await authApi.getProfile()
                setUser(profile)
                const botsRes = await botApi.list({ ownerId: profile.id })
                setBots(botsRes.data || [])
            } catch (err) {
                console.error("Failed to load bots:", err)
                toast.error("Failed to load chatbots")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const handleCreateBot = async () => {
        if (!newBot.name) return
        try {
            setIsCreating(true)
            const bot = await botApi.create({
                ...newBot,
                ownerId: user.id
            })
            setBots([bot, ...bots])
            setIsCreateDialogOpen(false)
            setNewBot({ name: "", description: "", botPersona: "" })
            toast.success("Bot created successfully")
        } catch (err) {
            console.error("Create bot failed:", err)
            toast.error("Failed to create bot")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteBot = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bot?")) return
        try {
            await botApi.delete(id)
            setBots(bots.filter((b) => b.id !== id))
            toast.success("Bot deleted")
        } catch (err) {
            toast.error("Delete failed")
        }
    }

    const filteredBots = bots.filter(
        (bot) =>
            bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Chatbots</h1>
                    <p className="text-muted-foreground">
                        Create, manage, and test your specialized AI agents.
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
                            <Plus className="size-4" />
                            Create New Bot
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Chatbot</DialogTitle>
                            <DialogDescription>
                                Set up a new AI agent with its own unique personality.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Bot Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. FAQ Assistant"
                                    value={newBot.name}
                                    onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Short Description</Label>
                                <Input
                                    id="description"
                                    placeholder="What is this bot for?"
                                    value={newBot.description}
                                    onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="persona">Bot Persona</Label>
                                <Textarea
                                    id="persona"
                                    placeholder="How should the bot behave? (e.g. Professional, friendly, expert in finance)"
                                    value={newBot.botPersona}
                                    onChange={(e) => setNewBot({ ...newBot, botPersona: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateBot} disabled={!newBot.name || isCreating} className="w-full">
                                {isCreating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                                Initialize Bot
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search bots by name or description..."
                    className="pl-10 max-w-md bg-background/50 border-primary/5 focus-visible:ring-primary/50 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[280px] w-full rounded-2xl" />
                    ))}
                </div>
            ) : filteredBots.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredBots.map((bot) => (
                        <Card key={bot.id} className="relative overflow-hidden flex flex-col border-primary/10 rounded-2xl shadow-sm bg-background/50 hover:border-primary/30 transition-all group">
                            <CardHeader className="relative space-y-0">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Bot className="size-6" />
                                </div>
                                <div className="absolute top-4 right-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                <MoreVertical className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="gap-2">
                                                <Bot className="size-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteBot(bot.id)}>
                                                <Trash2 className="size-4" /> Delete Bot
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="text-xl transition-colors">{bot.name}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-2 h-10">
                                    {bot.description || "No description provided"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 mt-4">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Persona</p>
                                    <p className="text-sm text-balance leading-relaxed text-muted-foreground line-clamp-3">
                                        {bot.botPersona || "Flexible and helpful assistant."}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 pt-0">
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all"
                                    onClick={() => router.push(`/dashboard/chatbot/${bot.id}`)}
                                >
                                    <Eye className="size-4" />
                                    View Details
                                </Button>
                                <Button
                                    className="w-full gap-2 rounded-xl shadow-md shadow-primary/10 bg-primary disabled:opacity-50 disabled:grayscale transition-all"
                                    disabled={!bot.dataSourceCount || bot.dataSourceCount === 0}
                                    onClick={() => router.push(`/dashboard/chatbot/${bot.id}/playground`)}
                                >
                                    <MessageSquare className="size-4" />
                                    {bot.dataSourceCount === 0 ? "No Data Source" : "Launch Playground"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center bg-muted/10 border-2 border-dashed rounded-3xl border-primary/5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-inner">
                        <Bot className="size-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold">No bots found</h3>
                        <p className="text-muted-foreground max-w-[300px]">
                            {searchQuery ? `No results match "${searchQuery}"` : "Get started by creating your first specialized AI bot."}
                        </p>
                    </div>
                    {!searchQuery && (
                        <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="mt-2 rounded-xl hover:bg-primary hover:text-white transition-colors">
                            Initialize First Bot
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
