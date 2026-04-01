"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Bot,
    ChevronLeft,
    Send,
    Loader2,
    User,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { botApi, chatApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function BotPlaygroundPage() {
    const { id } = useParams()
    const router = useRouter()

    const [bot, setBot] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

    useEffect(() => {
        const fetchBot = async () => {
            if (!id) return
            try {
                setLoading(true)
                const res = await botApi.get(id as string)
                setBot(res)
                setMessages([
                    {
                        id: "welcome",
                        role: "assistant",
                        content: `Hi! I'm ${res.name}. How can I help you today?`,
                        createdAt: new Date().toISOString()
                    }
                ])
            } catch (err) {
                console.error("Failed to load bot:", err)
                toast.error("Bot not found")
                router.push("/dashboard/chatbot")
            } finally {
                setLoading(false)
            }
        }
        fetchBot()
    }, [id, router])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !bot || isSending) return

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
                bot.id,
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

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-8 h-[calc(100vh-8rem)]">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="flex-1 rounded-3xl" />
            </div>
        )
    }

    if (!bot) return null

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in slide-in-from-right duration-500 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/chatbot/${bot.id}`)}
                        className="rounded-full hover:bg-primary/10"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                            <Bot className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{bot.name} - Playground</h2>
                            <p className="text-xs text-muted-foreground">Internal Testing Interface</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 overflow-hidden flex flex-col bg-background/50 border rounded-2xl shadow-xl border-primary/10 backdrop-blur-sm">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                <Avatar className="h-8 w-8 shrink-0 shadow-sm border border-primary/5">
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

                <div className="p-4 bg-muted/20 border-t border-primary/5">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Ask ${bot.name} anything...`}
                            className="flex-1 bg-background/50 border-primary/10 focus-visible:ring-primary shadow-inner rounded-xl"
                            disabled={isSending}
                        />
                        <Button type="submit" size="icon" disabled={!input.trim() || isSending} className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform bg-primary">
                            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
