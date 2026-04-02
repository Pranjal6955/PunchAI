"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Send,
    Bot,
    User,
    Trash2,
    ArrowLeft,
    Sparkles,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useHeader } from "@/lib/header-context"
import { botApi, chatApi } from "@/lib/api-client"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function PlaygroundPage() {
    const params = useParams()
    const router = useRouter()
    const botId = params.id as string
    const { setTitle } = useHeader()

    const [bot, setBot] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [chatId, setChatId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (botId) {
            fetchBot()
        }
        return () => setTitle(null)
    }, [botId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        }
    }, [messages, sending])

    const fetchBot = async () => {
        try {
            setLoading(true)
            const data = await botApi.get(botId)
            setBot(data)
            setTitle(`Playground: ${data.name}`)
        } catch (error) {
            toast.error("Bot not found")
            router.push("/dashboard")
        } finally {
            setLoading(false)
        }
    }

    const initChat = async () => {
        try {
            const userStr = localStorage.getItem("user")
            if (!userStr) {
                toast.error("User session not found. Please log in again.")
                return null
            }
            const user = JSON.parse(userStr)
            const response = await chatApi.create(user.id, botId)
            setChatId(response.id)
            return response.id
        } catch (error) {
            toast.error("Failed to start AI session")
            return null
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || sending) return

        const userMsg = { role: "USER", content: input, createdAt: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        const currentInput = input
        setInput("")
        setSending(true)

        try {
            let activeChatId = chatId
            if (!activeChatId) {
                activeChatId = await initChat()
            }

            if (activeChatId) {
                const aiResponse = await chatApi.sendMessage(activeChatId, currentInput)
                setMessages(prev => [...prev, aiResponse])
            }
        } catch (error) {
            toast.error("AI inference error")
            setMessages(prev => [...prev, {
                role: "ASSISTANT",
                content: "Error: Could not reach AI backend. Please verify your local system is running Ollama with the appropriate model.",
                createdAt: new Date().toISOString()
            }])
        } finally {
            setSending(false)
        }
    }

    const clearChat = () => {
        setMessages([])
        setChatId(null)
        toast.info("Session reset")
    }

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Initializing Playground...</p>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto w-full gap-4 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight leading-none">Chat Playground</h1>
                        <p className="text-xs text-muted-foreground mt-1">Testing: {bot?.name}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={clearChat} className="bg-background/50 hover:bg-destructive/10 hover:text-destructive border-dashed border-muted-foreground/20 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Reset Session
                </Button>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 flex flex-col min-h-0 border-muted/30 bg-muted/5 backdrop-blur-sm shadow-2xl relative overflow-hidden rounded-[2rem]">
                <ScrollArea className="flex-1 px-4 md:px-8 py-8">
                    <div ref={scrollRef} className="max-w-4xl mx-auto space-y-8">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                                <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20">
                                    <Sparkles className="h-10 w-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight">Test your Intelligence</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        Ask {bot?.name} anything. The agent uses its knowledge base to provide context-aware responses.
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-center max-w-md">
                                    {["What can you do?", "Tell me about your knowledge base.", "Summarize the sources."].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInput(suggestion)}
                                            className="px-4 py-2 rounded-xl border border-muted-foreground/10 bg-background/50 hover:bg-background hover:border-primary/50 text-xs transition-all shadow-sm"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex w-full animate-in fade-in slide-in-from-bottom-3 duration-300",
                                            msg.role === 'USER' ? 'justify-end' : 'justify-start'
                                        )}
                                    >
                                        <div className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'
                                        )}>
                                            <Avatar className={cn(
                                                "h-8 w-8 border",
                                                msg.role === 'USER' ? 'bg-primary border-primary' : 'bg-background border-muted'
                                            )}>
                                                <AvatarFallback className={msg.role === 'USER' ? 'text-primary-foreground' : ''}>
                                                    {msg.role === 'USER' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col space-y-1.5">
                                                <div className={cn(
                                                    "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                                    msg.role === 'USER'
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-background border border-muted/50 rounded-tl-none'
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] text-muted-foreground/60 px-1",
                                                    msg.role === 'USER' ? 'text-right' : 'text-left'
                                                )}>
                                                    {format(new Date(msg.createdAt || Date.now()), "p")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start animate-in fade-in duration-300">
                                        <div className="flex gap-3 max-w-[85%]">
                                            <Avatar className="h-8 w-8 border bg-background border-muted">
                                                <AvatarFallback>
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-background border border-muted/50 flex items-center shadow-sm">
                                                <div className="flex gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s]" />
                                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.8s]" />
                                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.8s]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 md:p-6 border-t bg-background/50 backdrop-blur-md">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2 items-end">
                        <div className="relative flex-1 group">
                            <Input
                                placeholder="Send a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="min-h-[56px] pr-12 bg-background border-muted-foreground/10 rounded-2xl shadow-sm focus-visible:ring-primary/20 transition-all group-hover:border-muted-foreground/20"
                                disabled={sending}
                            />
                            <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/40 font-mono tracking-tighter pointer-events-none hidden md:block">
                                Press Enter ↵
                            </div>
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            className="h-[56px] w-[56px] rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                            disabled={!input.trim() || sending}
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground/40 mt-4 uppercase tracking-[0.2em] font-medium">
                        AI-generated responses may contain inaccuracies
                    </p>
                </div>
            </Card>
        </div>
    )
}