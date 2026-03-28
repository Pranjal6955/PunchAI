"use client"

import { Bot, CreditCard, Layers, Plus, TrendingUp, Users, Zap } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Line, LineChart, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { Skeleton } from "@/components/ui/skeleton"
import * as React from "react"
import { CreateBotDialog } from "@/components/chatbot/create-bot-dialog"
import { api } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const usageData = [
    { day: "Mon", tokens: 4200 },
    { day: "Tue", tokens: 5300 },
    { day: "Wed", tokens: 4800 },
    { day: "Thu", tokens: 6100 },
    { day: "Fri", tokens: 7200 },
    { day: "Sat", tokens: 3400 },
    { day: "Sun", tokens: 2900 },
]

const chartConfig = {
    tokens: {
        label: "Tokens",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

interface BotData {
    id: string
    name: string
    type: string
    description?: string
    createdAt: string
    status?: string // Added locally for demo
}

export default function DashboardPage() {
    const [loading, setLoading] = React.useState(true)
    const [bots, setBots] = React.useState<BotData[]>([])

    const fetchBots = React.useCallback(async () => {
        try {
            const data = await api.get("/bots/")
            setBots(data)
        } catch (error) {
            console.error("Failed to fetch bots:", error)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchBots()
    }, [fetchBots])

    if (loading) {
        return (
            <div className="flex flex-col gap-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-20 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48 mt-2" />
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-end gap-2 pt-10 px-6">
                            {[70, 90, 50, 85, 40, 75, 95].map((height, i) => (
                                <Skeleton key={i} className="w-full" style={{ height: `${height}%` }} />
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-9 w-9 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <div className="text-right space-y-2">
                                            <Skeleton className="h-4 w-12 ml-auto" />
                                            <Skeleton className="h-3 w-8 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time analytics and agent management.
                    </p>
                </div>
                <CreateBotDialog onSuccess={fetchBots} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                        <Bot className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bots.length}</div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                            {bots.length > 0 ? `Active across all regions` : `No bots created yet`}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                        <Zap className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4M</div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            74% of monthly quota
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                            +12% from yesterday
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                        <CreditCard className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$142.50</div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Estimated for April
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle>Token Consumption</CardTitle>
                        <CardDescription>
                            Daily token usage across all agents this week.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pt-4">
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <BarChart data={usageData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                                <XAxis
                                    dataKey="day"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="tokens"
                                    fill="var(--color-tokens)"
                                    radius={[4, 4, 0, 0]}
                                    className="fill-black dark:fill-zinc-200"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader>
                        <CardTitle>Recent Bots</CardTitle>
                        <CardDescription>Latest agents in your fleet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {bots.length > 0 ? (
                                bots.slice(0, 4).map((bot, i) => (
                                    <div key={bot.id} className="flex items-center gap-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                            <Bot className="h-5 w-5 text-black dark:text-zinc-200" />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1">
                                            <p className="text-sm font-medium leading-none">{bot.name}</p>
                                            <p className="text-xs text-muted-foreground">{bot.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(bot.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Bot className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                    <p className="text-sm text-muted-foreground">No bots yet. Create one to get started.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Agents</CardTitle>
                            <CardDescription>Manage your deployed AI instances.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Agent Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Model Type</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bots.length > 0 ? (
                                bots.map((bot) => (
                                    <TableRow key={bot.id}>
                                        <TableCell className="font-medium">{bot.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                                            >
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{bot.type}</TableCell>
                                        <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">
                                            {new Date(bot.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <Button variant="ghost" size="sm" className="text-xs">
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No agents found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
