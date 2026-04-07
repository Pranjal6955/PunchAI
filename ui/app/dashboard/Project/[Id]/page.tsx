"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bot as BotIcon, Database, Settings, Shield, Edit3, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatInterface } from "@/components/dashboard/chat-interface"
import { getBot, getProfile, updateBot, Bot } from "@/lib/api-session"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AgentDashboard() {
    const { Id } = useParams()
    const router = useRouter()
    const [bot, setBot] = useState<Bot | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: "",
        description: "",
        botPersona: ""
    })

    useEffect(() => {
        const fetchData = async () => {
            if (!Id) return
            setLoading(true)
            try {
                const [botData, profile] = await Promise.all([
                    getBot(Id as string),
                    getProfile()
                ])

                if (botData) {
                    setBot(botData)
                    setEditFormData({
                        name: botData.name,
                        description: botData.description || "",
                        botPersona: botData.botPersona
                    })
                } else {
                    toast.error("Agent not found")
                    router.push("/dashboard/Project")
                }
                setUser(profile)
            } catch (error) {
                console.error("Failed to fetch agent", error)
                toast.error("Error loading agent data")
            } finally {
                setLoading(false)
            }
        }

        void fetchData()
    }, [Id, router])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bot) return

        setUpdating(true)
        try {
            const updated = await updateBot(bot.id, editFormData)
            if (updated) {
                setBot(updated)
                toast.success("Agent updated successfully")
                setEditDialogOpen(false)
            } else {
                toast.error("Failed to update agent")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-none" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-none" />
                        <Skeleton className="h-4 w-32 rounded-none" />
                    </div>
                </div>
                <Skeleton className="h-[600px] w-full rounded-none" />
            </div>
        )
    }

    if (!bot || !user) return null

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="border-b border-border/40 bg-muted/20 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/Project">
                        <Button variant="ghost" size="icon" className="rounded-none hover:bg-background">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20">
                            <BotIcon className="size-5 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-semibold tracking-tight">{bot.name}</h1>
                                <Badge variant="outline" className="rounded-none text-[8px] uppercase font-bold tracking-widest h-4 px-1.5 opacity-60">Production</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="rounded-none text-[9px] uppercase font-bold tracking-tighter h-4">
                                    Agent ID: {bot.id.substring(0, 8)}...
                                </Badge>
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-none border-border/60 h-9 gap-2 shadow-none">
                                <Edit3 className="size-3.5" />
                                Edit Agent
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] rounded-none border-border/60">
                            <form onSubmit={handleUpdate}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-semibold tracking-tight">Edit Agent Details</DialogTitle>
                                    <DialogDescription>
                                        Modify your agent's core identity and behavior logic.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name" className="text-sm font-medium">Agent Name</Label>
                                        <Input
                                            id="edit-name"
                                            className="rounded-none border-border/60"
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
                                        <Input
                                            id="edit-description"
                                            className="rounded-none border-border/60"
                                            value={editFormData.description}
                                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-persona" className="text-sm font-medium">System Prompt / Persona</Label>
                                        <Textarea
                                            id="edit-persona"
                                            className="rounded-none border-border/60 min-h-[180px] resize-none"
                                            value={editFormData.botPersona}
                                            onChange={(e) => setEditFormData({ ...editFormData, botPersona: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-none"
                                        onClick={() => setEditDialogOpen(false)}
                                        disabled={updating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="rounded-none min-w-[100px]"
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" className="rounded-none border-border/60 h-9 gap-2 shadow-none">
                        <Database className="size-3.5" />
                        Knowledge Base
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-none border-border/60 h-9 gap-2 shadow-none">
                        <Settings className="size-3.5" />
                        Settings
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-8">
                    <Tabs defaultValue="chat" className="w-full">
                        <TabsList className="rounded-none border-b border-border/40 bg-transparent w-full justify-start h-auto p-0 mb-8 space-x-8">
                            <TabsTrigger
                                value="chat"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-sm font-semibold tracking-tight transition-all"
                            >
                                Interaction Hub
                            </TabsTrigger>
                            <TabsTrigger
                                value="persona"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-sm font-semibold tracking-tight transition-all"
                            >
                                Persona Definition
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 text-sm font-semibold tracking-tight transition-all"
                            >
                                Analytics
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="chat" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <ChatInterface bot={bot} userId={user.id} />
                                </div>
                                <div className="space-y-6">
                                    <div className="border border-border/60 bg-muted/10 p-6 space-y-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Shield className="size-4" />
                                            <h3 className="text-xs font-bold uppercase tracking-widest">System Overview</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Retrieval Mode</p>
                                                <p className="text-sm font-semibold text-foreground">Hybrid (Dense + Sparse)</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Data Source Connectivity</p>
                                                <p className="text-sm font-semibold text-foreground">{bot.dataSourceCount || 0} active connections</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">LLM Provider</p>
                                                <p className="text-sm font-semibold text-foreground">OpenRouter / Groq</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-border/60 bg-background p-6 space-y-4 shadow-xl shadow-primary/5">
                                        <h3 className="text-xs font-bold uppercase tracking-widest">Shortcuts</h3>
                                        <div className="grid gap-2">
                                            <Button variant="outline" className="w-full justify-start rounded-none h-10 border-border/40 text-xs font-medium">Re-index Knowledge Base</Button>
                                            <Button variant="outline" className="w-full justify-start rounded-none h-10 border-border/40 text-xs font-medium">Clear Chat History</Button>
                                            <Button variant="outline" className="w-full justify-start rounded-none h-10 border-border/40 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive">Reset Agent State</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="persona" className="mt-0">
                            <div className="border border-border/60 bg-card p-10 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight">System Prompt</h2>
                                    <p className="text-muted-foreground italic text-sm">"The foundational logic that governs this agent's entire cognitive process."</p>
                                </div>
                                <div className="p-6 bg-muted/30 border border-border/40 font-mono text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                    {bot.botPersona}
                                </div>
                                <div className="flex justify-end">
                                    <Button className="rounded-none px-8" onClick={() => setEditDialogOpen(true)}>Edit Persona</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
