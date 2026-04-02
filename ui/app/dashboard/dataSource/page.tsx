"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Bot, ChevronRight, Search, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { botApi } from "@/lib/api-client"
import Link from "next/link"

export default function DataSourceSelectorPage() {
    const [bots, setBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchBots()
    }, [])

    const fetchBots = async () => {
        try {
            setLoading(true)
            const userStr = localStorage.getItem("user")
            const user = userStr ? JSON.parse(userStr) : null
            const response = await botApi.list(user?.id)
            setBots(response.data)
        } catch (error: any) {
            toast.error("Failed to load chatbots")
        } finally {
            setLoading(false)
        }
    }

    const filteredBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bot.description && bot.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Select Chatbot</h1>
                    <p className="text-muted-foreground text-sm">Choose a chatbot to manage its data sources and knowledge base.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chatbots..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredBots.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-3xl bg-muted/5 mt-4">
                    <Database className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">No chatbots found</h3>
                    <p className="text-muted-foreground text-center">
                        {searchQuery ? "Try a different search term or create a chatbot first." : "Create your first chatbot to start managing data sources."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {filteredBots.map((bot) => (
                        <Link key={bot.id} href={`/dashboard/dataSource/${bot.id}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <CardTitle className="text-sm truncate">{bot.name}</CardTitle>
                                        <CardDescription className="text-xs truncate">{bot.dataSourceCount || 0} Sources</CardDescription>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
