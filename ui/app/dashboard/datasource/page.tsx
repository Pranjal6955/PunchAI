"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Bot,
    Search,
    ChevronLeft,
} from "lucide-react"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { botApi, authApi } from "@/lib/api-client"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export default function DataSourcePage() {
    const router = useRouter()
    const [bots, setBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchBots = async () => {
            try {
                setLoading(true)
                const profile = await authApi.getProfile()
                const botsRes = await botApi.list({ ownerId: profile.id })
                setBots(botsRes.data || [])
            } catch (err) {
                console.error("Failed to load bots:", err)
                toast.error("Failed to load chatbots")
            } finally {
                setLoading(false)
            }
        }
        fetchBots()
    }, [])

    const filteredBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                <p className="text-muted-foreground">
                    Select a chatbot to manage its knowledge base and training data.
                </p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search your bots..."
                    className="pl-10 bg-background/50 border-primary/5 focus-visible:ring-primary/50 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
            ) : filteredBots.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredBots.map(bot => (
                        <Card
                            key={bot.id}
                            className="group relative overflow-hidden flex flex-col border-primary/10 rounded-2xl shadow-sm bg-background/50 hover:border-primary/30 hover:shadow-primary/5 transition-all cursor-pointer"
                            onClick={() => router.push(`/dashboard/datasource/${bot.id}`)}
                        >
                            <CardHeader>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Bot className="size-6" />
                                </div>
                                <CardTitle>{bot.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{bot.description || "Knowledge management"}</CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto border-t border-primary/5 pt-4">
                                <Button variant="ghost" className="w-full justify-between items-center group-hover:text-primary transition-colors">
                                    Manage Knowledge Base
                                    <ChevronLeft className="size-4 rotate-180" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center bg-muted/10 border-2 border-dashed rounded-3xl border-primary/5">
                    <Bot className="size-12 text-muted-foreground/20" />
                    <h3 className="text-xl font-semibold">No bots found</h3>
                    <p className="text-muted-foreground">Create a bot in the Chatbots page first.</p>
                </div>
            )}
        </div>
    )
}
