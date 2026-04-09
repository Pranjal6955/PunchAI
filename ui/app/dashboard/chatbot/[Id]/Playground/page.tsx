"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { getBot, getProfile, addMessage, createChat, Bot, User, Message } from "@/lib/api-session"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Send, ArrowLeft, Bot as BotIcon, User as UserIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function PlaygroundPage() {
    const { Id } = useParams()
    const router = useRouter()

    const [bot, setBot] = React.useState<Bot | null>(null)
    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)

    // Chat states
    const [messages, setMessages] = React.useState<Message[]>([])
    const [input, setInput] = React.useState("")
    const [sending, setSending] = React.useState(false)
    const [chatId, setChatId] = React.useState<string | null>(null)

    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const fetchData = async () => {
            if (!Id) return
            try {
                const [botData, profile] = await Promise.all([
                    getBot(Id as string),
                    getProfile(),
                ])

                if (botData && profile) {
                    setBot(botData)
                    setUser(profile)

                    // Initialize chat session
                    const chat = await createChat({ userId: profile.id, botId: botData.id })
                    if (chat) {
                        setChatId(chat.id)
                        setMessages(chat.messages || [])
                    }
                } else {
                    toast.error("Data could not be loaded")
                    router.push("/dashboard/chatbot")
                }
            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setLoading(false)
            }
        }
        void fetchData()
    }, [Id, router])

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            })
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !chatId || sending) return

        const userContent = input.trim()
        setInput("")

        // Optimistic update
        const tempMsg: Message = {
            id: Date.now().toString(),
            role: "USER",
            content: userContent,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempMsg])

        setSending(true)
        try {
            const reply = await addMessage(chatId, userContent)
            if (reply) {
                setMessages(prev => [...prev, reply])
            }
        } catch (error) {
            toast.error("Failed to send message")
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-background p-8 space-y-4">
                <Skeleton className="h-10 w-64 rounded-none" />
                <Skeleton className="flex-1 w-full rounded-none" />
            </div>
        )
    }

    if (!bot || !user) return null

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden font-sans">
            {/* Simple Header */}
            <div className="flex items-center gap-4 px-6 h-16 border-b border-border/40">
                <Link href={`/dashboard/chatbot/${Id}`}>
                    <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 hover:bg-muted">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20">
                        <BotIcon className="size-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight">{bot.name}</span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            {/* Chat History */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-muted/5"
            >
                <div className="max-w-3xl mx-auto w-full space-y-8">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <BotIcon className="size-16 mb-6 text-primary/40" />
                            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Start a New Conversation</h2>
                            <p className="text-sm text-muted-foreground mb-12 max-w-sm font-medium">
                                Ask {bot.name} anything about your connected data sources.
                            </p>

                            <div className="grid gap-3 w-full max-w-md">
                                {[
                                    "Tell me about the documents you've processed.",
                                    "What are the key takeaways from your data?",
                                    "Help me understand how you can assist me.",
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            setInput(q)
                                            // Trigger send by manually calling or setting state
                                            // Since we're in a click handler, we can just call the logic
                                            const fakeEvent = { preventDefault: () => { } } as React.FormEvent
                                            setTimeout(() => {
                                                const btn = document.getElementById('send-button')
                                                btn?.click()
                                            }, 10)
                                        }}
                                        className="text-[11px] uppercase tracking-widest font-bold px-6 py-4 border border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-left group flex items-center justify-between"
                                    >
                                        {q}
                                        <Send className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === "USER" ? "flex-row-reverse" : "flex-row"}`}>
                                <div className={`size-8 rounded-none border flex items-center justify-center shrink-0 ${msg.role === "USER" ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"}`}>
                                    {msg.role === "USER" ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                                </div>
                                <div className={`max-w-[85%] px-5 py-3 text-sm leading-relaxed border ${msg.role === "USER"
                                    ? "bg-primary/5 border-primary/20 text-foreground"
                                    : "bg-background border-border shadow-sm"
                                    }`}>
                                    {msg.content}

                                </div>
                            </div>
                        ))
                    )}
                    {sending && (
                        <div className="flex gap-4">
                            <div className="size-8 rounded-none border border-border bg-background flex items-center justify-center shrink-0">
                                <BotIcon className="size-4" />
                            </div>
                            <div className="bg-background border border-border px-5 py-3 shadow-sm">
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Simple Input Bar */}
            <div className="p-4 md:p-8 bg-background border-t border-border/40">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
                    <Input
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={sending}
                        className="rounded-none border-border/60 h-12 px-5 focus-visible:ring-0 focus-visible:border-primary bg-muted/5 whitespace-pre-wrap"
                    />
                    <Button
                        id="send-button"
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="rounded-none h-12 px-6 shrink-0 shadow-lg shadow-primary/20"
                    >
                        <Send className="size-4 mr-2" />
                        Send
                    </Button>
                </form>
            </div>
        </div>
    )
}
