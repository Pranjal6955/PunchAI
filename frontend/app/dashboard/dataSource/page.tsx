"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Globe,
    FileText,
    Database,
    Settings2,
    RefreshCcw,
    MoreVertical,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { Skeleton } from "@/components/ui/skeleton"

const dataSources = [
    {
        id: "1",
        name: "Platform Documentation",
        type: "Website",
        url: "https://docs.punchai.com",
        status: "Synced",
        lastSync: "12 mins ago",
        contentCount: "142 pages",
        syncProgress: 100,
    },
    {
        id: "2",
        name: "Customer Support Portal",
        type: "Website",
        url: "https://support.punchai.com",
        status: "Syncing",
        lastSync: "Just now",
        contentCount: "89 pages",
        syncProgress: 45,
    },
    {
        id: "3",
        name: "Company Internal Wiki",
        type: "PDF Library",
        url: "internal-share/wiki",
        status: "Error",
        lastSync: "3 hours ago",
        contentCount: "12 files",
        syncProgress: 0,
    },
    {
        id: "4",
        name: "Product Roadmap Q3",
        type: "Text/Markdown",
        url: "roadmap-v2.md",
        status: "Synced",
        lastSync: "1 day ago",
        contentCount: "2,400 words",
        syncProgress: 100,
    },
    {
        id: "5",
        name: "API Reference v1",
        type: "Swagger/OpenAPI",
        url: "https://api.punchai.com/spec",
        status: "Synced",
        lastSync: "5 mins ago",
        contentCount: "42 endpoints",
        syncProgress: 100,
    },
]

export default function DataSourcePage() {
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-6 pb-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-32 hidden md:block" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader>
                        <Skeleton className="h-9 w-full max-w-sm" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b border-zinc-50 dark:border-zinc-900 last:border-0">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                    <p className="text-muted-foreground mt-1">
                        Connect and manage the raw knowledge that powers your AI agents.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden h-9 md:flex">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh All
                    </Button>
                    <Button className="h-9 bg-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Source
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Synced Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4 / 5</div>
                        <div className="mt-2 h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[80%]" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.2M</div>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Indexed Content</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Last Global Sync</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-zinc-400" />
                            12m ago
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Automatic sync every 24h</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-xl border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter sources..." className="pl-9 h-9 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-100 dark:border-zinc-900">
                                <TableHead className="w-[300px]">Source</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataSources.map((source) => (
                                <TableRow key={source.id} className="border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-sm">{source.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[240px]">{source.url}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {source.type === "Website" && <Globe className="h-3.5 w-3.5 text-blue-500" />}
                                            {source.type === "PDF Library" && <FileText className="h-3.5 w-3.5 text-red-500" />}
                                            {source.type === "Text/Markdown" && <Database className="h-3.5 w-3.5 text-zinc-500" />}
                                            {source.type === "Swagger/OpenAPI" && <ExternalLink className="h-3.5 w-3.5 text-green-500" />}
                                            <span className="text-sm">{source.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 w-32">
                                            <div className="flex items-center gap-1.5">
                                                {source.status === "Synced" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                                {source.status === "Syncing" && <RefreshCcw className="h-3 w-3 text-blue-500 animate-spin" />}
                                                {source.status === "Error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                                                <span className={cn(
                                                    "text-xs font-semibold uppercase tracking-wider",
                                                    source.status === "Synced" && "text-green-600 dark:text-green-400",
                                                    source.status === "Syncing" && "text-blue-600 dark:text-blue-400",
                                                    source.status === "Error" && "text-red-600 dark:text-red-400"
                                                )}>
                                                    {source.status}
                                                </span>
                                            </div>
                                            {source.status === "Syncing" && (
                                                <Progress value={source.syncProgress} className="h-1" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{source.contentCount}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{source.lastSync}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <RefreshCcw className="mr-2 h-4 w-4" /> Sync Now
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Settings2 className="mr-2 h-4 w-4" /> Configure
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

