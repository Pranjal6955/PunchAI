"use client"

import { useState, useEffect, useRef } from "react"
import { Send, User, Bot as BotIcon, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getChat, addMessage, createChat, Bot, Message } from "@/lib/api-session"

interface ChatInterfaceProps {
    bot: Bot
    userId: string
}

export function ChatInterface({ bot, userId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [chatId, setChatId] = useState<string | null>(null)
    const [initializing, setInitializing] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const initChat = async () => {
            setInitializing(true)
            try {
                // For simplicity, we create a new chat every time or fetch the last one
                // In a real app, you might want to list previous chats
                const chat = await createChat({ userId, botId: bot.id })
                if (chat) {
                    setChatId(chat.id)
                    setMessages(chat.messages || [])
                }
            } catch (error) {
                console.error("Failed to initialize chat", error)
                toast.error("Failed to start chat session")
            } finally {
                setInitializing(false)
            }
        }

        initChat()
    }, [bot.id, userId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            })
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !chatId || loading) return

        const userMessageContent = input.trim()
        setInput("")

        // Optimistic update
        const tempUserMsg: Message = {
            id: Date.now().toString(),
            role: "USER",
            content: userMessageContent,
            createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, tempUserMsg])

        setLoading(true)
        try {
            const response = await addMessage(chatId, userMessageContent)
            if (response) {
                setMessages(prev => [...prev, response])
            } else {
                toast.error("Failed to get response from agent")
            }
        } catch (error) {
            toast.error("An error occurred while sending message")
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return (
            <Card className="flex flex-col h-[600px] rounded-none border-border/60 shadow-none">
                <CardHeader className="border-b border-border/40 py-4">
                    <Skeleton className="h-6 w-48 rounded-none" />
                </CardHeader>
                <CardContent className="flex-1 p-6 space-y-4">
                    <Skeleton className="h-12 w-3/4 rounded-none" />
                    <Skeleton className="h-12 w-1/2 ml-auto rounded-none" />
                    <Skeleton className="h-12 w-2/3 rounded-none" />
                </CardContent>
                <CardFooter className="border-t border-border/40 p-4">
                    <Skeleton className="h-10 w-full rounded-none" />
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-[600px] rounded-none border-border/60 bg-background/50 backdrop-blur-sm shadow-none overflow-hidden">
            <CardHeader className="border-b border-border/40 py-4 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20">
                        <BotIcon className="size-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-medium">{bot.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Session</p>
                    </div>
                </div>
                <Badge variant="outline" className="rounded-none text-[10px] font-bold uppercase tracking-tighter">
                    RAG Enabled
                </Badge>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div
                    className="h-full overflow-y-auto p-6 scroll-smooth"
                    ref={scrollRef}
                >
                    <div className="space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 opacity-40 text-center">
                                <BotIcon className="size-12 mb-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Start a conversation with {bot.name}</p>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">Ask questions and get answers based on your data sources.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "USER" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <Avatar className="size-8 rounded-none border border-border/60">
                                        <AvatarFallback className="rounded-none text-[10px] font-bold">
                                            {msg.role === "USER" ? "U" : "AI"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`max-w-[80%] px-4 py-2.5 text-sm ${msg.role === "USER"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted border border-border/60"
                                            }`}
                                    >
                                        {msg.content}
                                        {msg.metadata?.source_chunks && (
                                            <div className="mt-2 pt-2 border-t border-border/20 text-[9px] uppercase tracking-widest font-bold opacity-60">
                                                Sourced from {msg.metadata.source_chunks} chunks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex gap-3">
                                <Avatar className="size-8 rounded-none border border-border/60">
                                    <AvatarFallback className="rounded-none text-[10px] font-bold">AI</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted border border-border/60 px-4 py-2.5">
                                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t border-border/40 p-4 bg-background">
                <form onSubmit={handleSend} className="flex w-full gap-2">
                    <Input
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="rounded-none border-border/60 focus-visible:ring-0 focus-visible:border-primary"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-none shrink-0 shadow-lg shadow-primary/20">
                        <Send className="size-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
