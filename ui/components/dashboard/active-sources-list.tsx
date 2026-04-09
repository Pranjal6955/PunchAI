"use client"

import * as React from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { DataSource } from "@/lib/api-session"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    FileText,
    Globe,
    MessageSquareText,
    Database,
    Settings2,
    Trash2,
    Search,
    Filter,
    Activity,
    MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActiveSourcesListProps {
    dataSources: DataSource[]
    sourcesLoading: boolean
    onViewDetails: (source: DataSource) => void
    onDelete: (id: string) => void
}

export function ActiveSourcesList({
    dataSources,
    sourcesLoading,
    onViewDetails,
    onDelete
}: ActiveSourcesListProps) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [filterType, setFilterType] = React.useState<string | null>(null)

    const filteredSources = dataSources.filter(source => {
        const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = !filterType || source.type === filterType
        return matchesSearch && matchesType
    })

    const counts = {
        total: dataSources.length,
        files: dataSources.filter(s => s.type === "FILE").length,
        urls: dataSources.filter(s => s.type === "URL").length,
        text: dataSources.filter(s => s.type === "TEXT").length,
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    }

    return (
        <div className="space-y-6">

            {/* List Container */}
            <Card className="rounded-none border-white/5 shadow-2xl bg-background/20 backdrop-blur-md overflow-hidden flex flex-col min-h-[500px]">
                <CardHeader className="border-b border-white/5 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary animate-pulse" />
                                Knowledge Hub
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Active data streams fueling your AI's intelligence.
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none md:min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search knowledge..."
                                    className="w-full h-10 pl-9 pr-4 rounded-none bg-white/5 border border-white/10 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center bg-white/5 rounded-none border border-white/10 p-1 gap-1">
                                {[
                                    { label: "All", value: null, icon: Database },
                                    { label: "Docs", value: "FILE", icon: FileText },
                                    { label: "Web", value: "URL", icon: Globe },
                                    { label: "FAQ", value: "TEXT", icon: MessageSquareText },
                                ].map((t) => (
                                    <button
                                        key={t.label}
                                        onClick={() => setFilterType(t.value)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all",
                                            filterType === t.value
                                                ? "bg-primary text-primary-foreground shadow-lg"
                                                : "hover:bg-white/5 text-muted-foreground"
                                        )}
                                    >
                                        <t.icon className="h-3 w-3" />
                                        <span className="hidden sm:inline">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-6 overflow-y-auto">
                    {sourcesLoading ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-none bg-white/5" />
                            ))}
                        </div>
                    ) : filteredSources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6">
                            <div className="h-24 w-24 rounded-none bg-primary/5 flex items-center justify-center border border-primary/20">
                                <Search className="h-10 w-10 text-primary/40" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">No results found</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    We couldn't find any data sources matching your current filters.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-primary/20 hover:bg-primary/5"
                                onClick={() => { setSearchQuery(""); setFilterType(null) }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 xl:grid-cols-2 gap-5"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredSources.map((source) => (
                                    <motion.div
                                        key={source.id}
                                        layout
                                        variants={itemVariants}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        className="group relative"
                                    >
                                        <div className="relative flex flex-col bg-white/[0.03] border border-white/5 rounded-none p-5 shadow-sm transition-all duration-300">

                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-none flex items-center justify-center border transition-all duration-300",
                                                        source.type === "FILE" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                            source.type === "URL" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                                "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                                    )}>
                                                        {source.type === "FILE" ? <FileText className="h-6 w-6" /> :
                                                            source.type === "URL" ? <Globe className="h-6 w-6" /> :
                                                                <MessageSquareText className="h-6 w-6" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-lg truncate leading-none mb-1 transition-colors">
                                                            {source.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-white/5 border-white/5 text-[10px] py-0 px-2 h-5 font-bold uppercase tracking-wider">
                                                                {source.type === "FILE" ? "Doc" : source.type === "URL" ? "Web" : "FAQ"}
                                                            </Badge>
                                                            {source.status !== "COMPLETED" && (
                                                                <Badge variant={source.status === "FAILED" ? "destructive" : "secondary"} className="h-5 px-2 text-[9px] rounded-none uppercase font-black tracking-tighter animate-pulse">
                                                                    {source.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none transition-all hover:bg-white/10"
                                                        onClick={() => onViewDetails(source)}
                                                    >
                                                        <Settings2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none transition-all text-destructive hover:bg-destructive/10"
                                                        onClick={() => onDelete(source.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

