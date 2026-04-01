"use client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Activity,
    ArrowUpRight,
    Bot,
    Database,
    MessageSquare,
    Users,
} from "lucide-react"
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { botApi, chatApi, authApi, datasourceApi } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

const trendData = [
    { name: "Mon", total: 400 },
    { name: "Tue", total: 300 },
    { name: "Wed", total: 200 },
    { name: "Thu", total: 278 },
    { name: "Fri", total: 189 },
    { name: "Sat", total: 239 },
    { name: "Sun", total: 349 },
]

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalBots: 0,
        totalChats: 0,
        totalSources: 0,
        activeNow: 0,
    })
    const [recentChats, setRecentChats] = useState<any[]>([])
    const [recentBots, setRecentBots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const profile = await authApi.getProfile()
                setUser(profile)

                const botsRes = await botApi.list({ ownerId: profile.id })
                const chatsRes = await chatApi.list(profile.id)

                let totalSources = 0
                if (botsRes.data) {
                    for (const bot of botsRes.data) {
                        try {
                            const sourcesRes = await datasourceApi.list(bot.id)
                            totalSources += sourcesRes.total || 0
                        } catch (err) {
                            console.error(`Error fetching sources for bot ${bot.id}:`, err)
                        }
                    }
                }

                setStats({
                    totalBots: botsRes.total || 0,
                    totalChats: chatsRes.total || 0,
                    totalSources: totalSources,
                    activeNow: 0,
                })

                setRecentChats(chatsRes.data?.slice(0, 4) || [])
                setRecentBots(botsRes.data?.slice(0, 5) || [])
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground">
                    Welcome back{user?.name ? `, ${user.name}` : ""}! Here's what's happening with your AI bots.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.totalBots}</div>
                                <p className="text-xs text-muted-foreground">
                                    Manage your AI agents
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.totalChats}</div>
                                <p className="text-xs text-muted-foreground">
                                    Active conversation threads
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.totalSources}</div>
                                <p className="text-xs text-muted-foreground">
                                    Knowledge base files
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.activeNow}</div>
                                <p className="text-xs text-muted-foreground">
                                    Users currently chatting
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 hover:shadow-xl transition-all duration-300 border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Bot History</CardTitle>
                            <CardDescription>
                                Overview of your AI agents and their configurations.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="hidden md:flex gap-1">
                            <Bot className="size-4" />
                            Create Bot
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[120px]" />
                                                <Skeleton className="h-3 w-[180px]" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                ))
                            ) : recentBots.length > 0 ? (
                                recentBots.map((bot) => (
                                    <div key={bot.id} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <Bot className="size-5" />
                                            </div>
                                            <div className="grid gap-1 overflow-hidden">
                                                <p className="text-sm font-semibold leading-none truncate">{bot.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{bot.botPersona || "General Assistant"}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {new Date(bot.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Bot className="size-8 opacity-20" />
                                    <p>No bots created yet</p>
                                    <Button variant="link" className="text-primary h-auto p-0">Create your first bot</Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest interactions with your AI agents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-3 w-[100px]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentChats.length > 0 ? (
                            <div className="space-y-8">
                                {recentChats.map((chat) => (
                                    <div key={chat.id} className="flex items-center gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{chat.title?.slice(0, 2).toUpperCase() || "CH"}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                                                {chat.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(chat.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                                No recent activity
                            </div>
                        )}
                        <Button variant="link" className="w-full mt-6 text-primary">
                            View All Activity <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
