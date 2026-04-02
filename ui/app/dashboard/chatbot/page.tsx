"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Plus, MessageSquare, MoreVertical, Trash2, Edit, Bot, Calendar, Database, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { botApi } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Chatbot {
    id: string
    name: string
    description: string
    botPersona: string
    dataSourceCount: number
    createdAt: string
    updatedAt: string
}

export default function ChatbotPage() {
    const [bots, setBots] = useState<Chatbot[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        botPersona: ""
    })

    useEffect(() => {
        const savedUser = localStorage.getItem("user")
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser))
            } catch (e) {
                console.error("Failed to parse user", e)
            }
        }
    }, [])

    const fetchBots = async (userId: string) => {
        try {
            setLoading(true)
            const response = await botApi.list(userId)
            setBots(response.data)
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch chatbots")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user?.id) {
            fetchBots(user.id)
        }
    }, [user])

    const handleCreateBot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return

        try {
            setIsSubmitting(true)
            await botApi.create({
                ...formData,
                ownerId: user.id
            })
            toast.success("Chatbot created successfully")
            setIsCreateDialogOpen(false)
            setFormData({ name: "", description: "", botPersona: "" })
            fetchBots(user.id)
        } catch (error: any) {
            toast.error(error.message || "Failed to create chatbot")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteBot = async (id: string) => {
        if (!confirm("Are you sure you want to delete this chatbot?")) return

        try {
            await botApi.delete(id)
            toast.success("Chatbot deleted successfully")
            setBots(bots.filter(b => b.id !== id))
        } catch (error: any) {
            toast.error(error.message || "Failed to delete chatbot")
        }
    }

    if (loading && !bots.length) {
        return (
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chatbots</h1>
                        <p className="text-muted-foreground">Manage your AI chatbots and their configurations.</p>
                    </div>
                    <Skeleton className="h-10 w-[150px]" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-[140px]" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                            <div className="flex items-center justify-start gap-2 px-4 pb-3 pt-0">
                                <Skeleton className="h-8 w-[100px]" />
                                <Skeleton className="h-8 w-[80px]" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chatbots</h1>
                    <p className="text-muted-foreground text-sm">Create and customize AI agents for your business needs.</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Chatbot
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Chatbot</DialogTitle>
                            <DialogDescription>
                                Set up a new AI agent. You can configure its persona and data sources later.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateBot}>
                            <div className="grid gap-5 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Chatbot Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Customer Success Assistant"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Short Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="What does this chatbot do?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="persona">Bot Persona / Instructions</Label>
                                    <Textarea
                                        id="persona"
                                        placeholder="I am a helpful assistant for PunchAI..."
                                        value={formData.botPersona}
                                        onChange={(e) => setFormData({ ...formData, botPersona: e.target.value })}
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create Chatbot"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {bots.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-muted/10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No chatbots yet</h3>
                    <p className="text-muted-foreground text-center max-w-[300px] mb-6">
                        Start by creating your first AI chatbot to automate your customer support.
                    </p>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Chatbot
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {bots.map((bot) => (
                        <Card key={bot.id}>
                            <CardHeader>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <CardAction>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="gap-2">
                                                <Edit className="h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2">
                                                <Database className="h-4 w-4" /> Data Sources
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-destructive focus:text-destructive"
                                                onClick={() => handleDeleteBot(bot.id)}
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardAction>
                                <CardTitle>{bot.name}</CardTitle>
                                <CardDescription className="line-clamp-1 text-xs">{bot.description || "No description."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Database className="h-3 w-3" />
                                        <span>{bot.dataSourceCount} Source{bot.dataSourceCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{bot.createdAt ? format(new Date(bot.createdAt), "MMM d") : "N/A"}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="flex items-center justify-start gap-2 px-4 pb-3 pt-0">
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-8 px-3 text-xs gap-1.5 bg-white text-black hover:bg-white/90 border-none"
                                >
                                    <Link href={`/dashboard/chatbot/${bot.id}`}>
                                        <Eye className="h-4 w-4" /> View Details
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    asChild
                                    size="sm"
                                    className="h-8 px-3 text-xs gap-1.5 border-border/50"
                                >
                                    <Link href={`/dashboard/chatbot/${bot.id}/playground`}>
                                        <MessageSquare className="h-4 w-4" /> Simulator
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function Settings2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
