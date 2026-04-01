"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Bot,
    ChevronLeft,
    Settings,
    Trash2,
    Calendar,
    User,
    Shield,
    Globe,
    Zap,
    Database,
    MessageSquare,
    ExternalLink,
    Edit3,
    History,
    Activity,
    Lock,
    Sparkles,
    Plus,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { botApi, authApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function BotDetailsPage() {
    const { id } = useParams()
    const router = useRouter()

    const [bot, setBot] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            if (!id) return
            try {
                setLoading(true)
                const [botRes, profile] = await Promise.all([
                    botApi.get(id as string),
                    authApi.getProfile()
                ])
                setBot(botRes)
                setUser(profile)
            } catch (err) {
                console.error("Failed to load bot details:", err)
                toast.error("Bot not found")
                router.push("/dashboard/chatbot")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [id, router])

    const handleDeleteBot = async () => {
        if (!confirm("Are you sure you want to permanently delete this bot and all its data?")) return
        try {
            await botApi.delete(bot.id)
            toast.success("Chatbot deleted successfully")
            router.push("/dashboard/chatbot")
        } catch (err) {
            toast.error("Failed to delete bot")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-8 p-2 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!bot) return null

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-700 pb-10">
            {/* Navigation & Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/chatbot")}
                        className="rounded-full shadow-sm hover:bg-primary/10 transition-colors"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{bot.name}</h1>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Database className="size-3" /> Knowledge Engine v1.0 • ID: {bot.id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl">
                        <Edit3 className="size-4" /> Edit Bot
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-xl shadow-lg shadow-destructive/10"
                        onClick={handleDeleteBot}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Bot Profile Card */}
                    <Card className="rounded-3xl border-primary/5 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                        <CardHeader className="p-8">
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Bot className="size-6 text-primary" />
                                    Agent Profile
                                </CardTitle>
                                <Button size="sm" variant="secondary" className="rounded-lg gap-2" onClick={() => router.push(`/dashboard/chatbot/playground?id=${bot.id}`)}>
                                    <Sparkles className="size-3" /> Test in Playground
                                </Button>
                            </div>
                            <CardDescription className="text-base text-balance leading-relaxed">
                                {bot.description || "This AI assistant is configured to help users with platform-specific queries and automated task handling."}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-8 space-y-8">
                            <Separator className="bg-primary/5" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Shield className="size-5 text-primary" />
                                    Bot Persona & Behavior
                                </h3>
                                <div className="p-6 rounded-2xl bg-muted/30 border border-primary/5 italic text-muted-foreground leading-relaxed relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <MessageSquare className="size-20" />
                                    </div>
                                    <p className="relative z-10">
                                        {bot.botPersona || "Friendly, professional, and accurate. The bot focuses on providing data-driven answers while maintaining a helpful tone."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Zap className="size-5 text-primary" />
                                        Performance Hub
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-background/40 border border-primary/5 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Response Time</p>
                                            <p className="text-xl font-bold">~1.2s</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-background/40 border border-primary/5 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Success Rate</p>
                                            <p className="text-xl font-bold text-emerald-500">99.4%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Database className="size-5 text-primary" />
                                        Data Context
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-background/40 border border-primary/5 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Context Depth</p>
                                            <p className="text-xl font-bold">Deep</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-background/40 border border-primary/5 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Model</p>
                                            <p className="text-xl font-bold">RAG-Optimized</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Embedding / Integration Card */}
                    <Card className="rounded-3xl border-primary/5 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Globe className="size-5 text-primary" />
                                Global Integration
                            </CardTitle>
                            <CardDescription>Use this snippet to embed your bot on any website.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="p-4 rounded-xl bg-muted font-mono text-xs overflow-x-auto relative group">
                                <code className="text-primary truncate block w-full whitespace-pre">
                                    {`<script src="https://punchai.io/chat-widget.js" data-bot-id="${bot.id}"></script>`}
                                </code>
                                <Button variant="secondary" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">Copy</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info Area */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Insights Card */}
                    <Card className="rounded-3xl border-primary/5 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="size-5 text-primary" />
                                Core Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <History className="size-4" />
                                    </div>
                                    <span className="text-sm font-medium">Total Messages</span>
                                </div>
                                <span className="font-bold text-lg">1,204</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <User className="size-4" />
                                    </div>
                                    <span className="text-sm font-medium">Unique Users</span>
                                </div>
                                <span className="font-bold text-lg">84</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                        <Lock className="size-4" />
                                    </div>
                                    <span className="text-sm font-medium">Privacy Tier</span>
                                </div>
                                <Badge variant="secondary">Enterprise</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Info Card */}
                    <Card className="rounded-3xl border-primary/5 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Calendar className="size-4" />
                                    <span>Created {new Date(bot.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <User className="size-4" />
                                    <span>Owner: {user?.name || "Member User"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Settings className="size-4" />
                                    <span>Engine Version: 4.2-Turbo</span>
                                </div>
                            </div>
                            <Separator className="bg-primary/5" />
                            <Button
                                className="w-full gap-2 rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95"
                                onClick={() => router.push(`/dashboard/datasource/${bot.id}`)}
                            >
                                <Database className="size-4" />
                                Manage Knowledge Base
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Access List */}
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                        <h4 className="font-semibold mb-4 text-primary flex items-center gap-2">
                            <Activity className="size-4" />
                            Quick Actions
                        </h4>
                        <div className="flex flex-col gap-2">
                            <Button variant="ghost" className="justify-between w-full h-11 px-4 hover:bg-background/50 rounded-xl" onClick={() => router.push(`/dashboard/datasource/${bot.id}`)}>
                                <span>Link new PDF</span>
                                <Plus className="size-4 opacity-40" />
                            </Button>
                            <Button variant="ghost" className="justify-between w-full h-11 px-4 hover:bg-background/50 rounded-xl">
                                <span>View analytics</span>
                                <ExternalLink className="size-4 opacity-40" />
                            </Button>
                            <Button variant="ghost" className="justify-between w-full h-11 px-4 hover:bg-background/50 rounded-xl text-destructive hover:text-destructive">
                                <span>Disable Agent</span>
                                <Lock className="size-4 opacity-40" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
