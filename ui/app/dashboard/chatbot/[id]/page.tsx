"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bot, Database, MessageSquare, Settings, Share2, Trash2, Calendar, Edit, Save, X, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { botApi } from "@/lib/api-client"
import { format } from "date-fns"
import { useHeader } from "@/lib/header-context"

export default function BotDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const botId = params.id as string
    const { setTitle } = useHeader()

    // Cleanup title on unmount
    useEffect(() => {
        return () => setTitle(null)
    }, [])

    const [bot, setBot] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        botPersona: ""
    })

    useEffect(() => {
        if (botId) {
            fetchBotDetails()
        }
    }, [botId])

    const fetchBotDetails = async () => {
        try {
            setLoading(true)
            const botData = await botApi.get(botId)
            if (botData && botData.name) {
                setBot(botData)
                setFormData({
                    name: botData.name,
                    description: botData.description || "",
                    botPersona: botData.botPersona || ""
                })
                setTitle(botData.name) // Explicitly set again to be sure
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch chatbot details")
            router.push("/dashboard/chatbot")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateBot = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await botApi.update(botId, formData)
            toast.success("Chatbot updated successfully")
            setBot({ ...bot, ...formData })
            setTitle(formData.name)
            setIsEditing(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to update chatbot")
        }
    }

    const handleDeleteBot = async () => {
        if (!confirm("Are you sure you want to delete this chatbot?")) return
        try {
            await botApi.delete(botId)
            toast.success("Chatbot deleted successfully")
            router.push("/dashboard/chatbot")
        } catch (error: any) {
            toast.error(error.message || "Failed to delete chatbot")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-[400px] md:col-span-2" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        )
    }

    if (!bot) return null

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{bot.name}</h1>
                            <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                Active Chatbot
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10" onClick={handleDeleteBot}>
                        <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                    <Button size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Chat Now
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Chatbot Configuration</CardTitle>
                                <CardDescription>Behavior and identity settings for your agent.</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateBot} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs text-muted-foreground">System Name</Label>
                                    {isEditing ? (
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-9"
                                        />
                                    ) : (
                                        <div className="text-base font-semibold py-1">{bot.name}</div>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-xs text-muted-foreground">Public Description</Label>
                                    {isEditing ? (
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="h-9"
                                        />
                                    ) : (
                                        <div className="text-sm text-muted-foreground py-1">
                                            {bot.description || "No description provided."}
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="botPersona" className="text-xs text-muted-foreground">Bot Persona & Instructions</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="botPersona"
                                            value={formData.botPersona}
                                            onChange={(e) => setFormData({ ...formData, botPersona: e.target.value })}
                                            rows={8}
                                            className="resize-none"
                                            placeholder="Explain how this chatbot should behave..."
                                        />
                                    ) : (
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap py-3 px-4 bg-muted/30 rounded-lg min-h-[100px] border border-border/50">
                                            {bot.botPersona || "No persona instructions provided."}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                                            <X className="h-4 w-4" /> Cancel
                                        </Button>
                                        <Button type="submit" className="gap-2">
                                            <Save className="h-4 w-4" /> Save Changes
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Integration</CardTitle>
                            <CardDescription>Knowledge base your chatbot uses to answer questions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-xl bg-muted/5">
                                <Database className="h-8 w-8 text-muted-foreground mb-3" />
                                <h4 className="font-medium mb-1">0 Knowledge Bases Connected</h4>
                                <p className="text-xs text-muted-foreground mb-4 text-center max-w-[300px]">
                                    Upload documents, link URLs or connect databases to train your chatbot.
                                </p>
                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                    <Link href={`/dashboard/dataSource/${botId}`}>
                                        <Database className="h-3.5 w-3.5" /> Manage Data Sources
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Created
                                </span>
                                <span className="font-medium">
                                    {bot.createdAt ? format(new Date(bot.createdAt), "PPP") : "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Bot className="h-4 w-4" /> Status
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                                    Ready
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Database className="h-4 w-4" /> Data training
                                </span>
                                <span className="font-medium">{bot.dataSourceCount || 0} Sources</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>Test your chatbot in real-time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-square rounded-xl bg-muted/20 flex flex-col items-center justify-center p-6 text-center">
                                <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    Preview your chatbot's interface and behavior before deploying.
                                </p>
                                <Button className="w-full">Open Simulator</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
