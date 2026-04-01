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
import { botApi, chatApi, authApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ChatbotPage() {
    const [bots, setBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [selectedBot, setSelectedBot] = useState<any>(null)
    const [view, setView] = useState<"list" | "chat">("list")

    // New Bot Form State
    const [newBot, setNewBot] = useState({
        name: "",
        description: "",
        botPersona: "",
    })

    // Chat State
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

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

    const startChat = (bot: any) => {
        setSelectedBot(bot)
        setView("chat")
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: `Hi! I'm ${bot.name}. How can I help you today?`,
                createdAt: new Date().toISOString()
            }
        ])
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !selectedBot || isSending) return

        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            createdAt: new Date().toISOString()
        }

        setMessages((prev) => [...prev, userMessage])
        const query = input.trim()
        setInput("")
        setIsSending(true)

        try {
            const response = await chatApi.sendMessage(
                selectedBot.id,
                query,
                currentSessionId || undefined
            )

            const botMessage = {
                id: response.id,
                role: "assistant",
                content: response.content,
                createdAt: new Date().toISOString()
            }

            if (response.sessionId) setCurrentSessionId(response.sessionId)
            setMessages((prev) => [...prev, botMessage])
        } catch (err) {
            console.error("Chat error:", err)
            toast.error("Failed to get response")
        } finally {
            setIsSending(false)
        }
    }

    const filteredBots = bots.filter(
        (bot) =>
            bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (view === "chat" && selectedBot) {
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setView("list")
                                setCurrentSessionId(null)
                            }}
                            className="rounded-full hover:bg-primary/10"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">{selectedBot.name}</h2>
                                <p className="text-xs text-muted-foreground">Playground Mode</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-background/50 border rounded-2xl shadow-xl border-primary/10 backdrop-blur-sm">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                    <Avatar className="h-8 w-8 shrink-0 shadow-sm">
                                        <AvatarFallback className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                            {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`p-4 rounded-2xl shadow-sm ${m.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-muted/80 backdrop-blur-sm border rounded-tl-none"
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                        <p className={`text-[10px] mt-2 ${m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isSending && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex gap-3 max-w-[80%]">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="bg-muted"><Bot className="size-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="p-4 bg-muted/80 border rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1 items-center">
                                            <span className="size-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                            <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-muted/20 border-t border-primary/5">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Talk to ${selectedBot.name}...`}
                                className="flex-1 bg-background/50 border-primary/10 focus-visible:ring-primary shadow-inner"
                                disabled={isSending}
                            />
                            <Button type="submit" size="icon" disabled={!input.trim() || isSending} className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform">
                                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

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
                        <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
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
                    className="pl-10 max-w-md bg-background/50 border-primary/5 focus-visible:ring-primary/50"
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
                        <Card key={bot.id} className="relative overflow-hidden flex flex-col border-primary/10 rounded-2xl shadow-sm bg-background/50">
                            <CardHeader className="relative space-y-0">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
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
                                                <Settings className="size-4" /> Edit Bot
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
                            <CardFooter className="pt-0">
                                <Button
                                    className="w-full gap-2 rounded-xl shadow-md shadow-primary/10"
                                    onClick={() => startChat(bot)}
                                >
                                    <MessageSquare className="size-4" />
                                    Launch Playground
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center bg-muted/20 border-2 border-dashed rounded-3xl border-primary/5">
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
