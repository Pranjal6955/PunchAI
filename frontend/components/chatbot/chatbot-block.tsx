"use client"

import * as React from "react"
import { Bot } from "@/lib/api-session"
import { Card, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreVertical,
    Trash2,
    ExternalLink,
    MessageSquare,
    Bot as BotIcon
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export const BOT_PERSONA_MAPPING: Record<string, string> = {
    "You are a professional and formal assistant. Provide well-structured, polite, and helpful responses.": "Professional",
    "You are a friendly and enthusiastic assistant. Use a warm, approachable tone and feel free to use emojis to keep a positive vibe.": "Friendly",
    "You are a highly skilled technical expert. Provide detailed, accurate, and expert-level technical answers with a focus on problem-solving.": "Technical",
    "You are a direct and concise assistant. Get straight to the point and provide clear, efficient answers without unnecessary preamble.": "Concise"
};

export const getPersonaName = (persona?: string) => {
    if (!persona) return "General";
    return BOT_PERSONA_MAPPING[persona] || "Custom";
};

interface ChatbotBlockProps {
    bot: Bot;
    viewMode: "grid" | "list";
    index: number;
    onDelete: (id: string) => void;
}

export function ChatbotBlock({ bot, viewMode, index, onDelete }: ChatbotBlockProps) {
    if (viewMode === "grid") {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
            >
                <Card className="group relative rounded-none border-border/60 bg-card hover:border-primary/50 transition-all duration-300 shadow-none hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full overflow-hidden">
                    <CardHeader className="pb-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="rounded-none uppercase tracking-widest text-[10px] font-bold px-4 py-1.5 border-border/40 w-fit justify-center bg-muted/60">
                                    {getPersonaName(bot.botPersona)}
                                </Badge>
                                <Badge variant="outline" className="rounded-none capitalize text-[10px] font-medium px-3 py-1 border-border/40 text-muted-foreground whitespace-nowrap">
                                    {bot.dataSourceCount || 0} Sources
                                </Badge>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none -mt-1 -mr-1">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[150px]">
                                    <DropdownMenuItem asChild className="cursor-pointer">
                                        <Link href={`/dashboard/chatbots/${bot.id}`}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onClick={() => onDelete(bot.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Chatbot
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors leading-tight flex items-center gap-2.5">
                                <BotIcon className="size-5 text-primary/80 group-hover:text-primary transition-colors shrink-0" />
                                {bot.name}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 mt-2.5 min-h-[40px]">
                                {bot.description || "Experimental chatbot for testing and development."}
                            </p>
                        </div>
                    </CardHeader>

                    <div className="mt-auto px-6 pb-6 flex flex-col gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
                        <div className="flex justify-between items-center w-full pb-2">
                            <span>
                                Created {new Date(bot.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button asChild variant="outline" size="sm" className="w-full h-9 text-[10px] uppercase font-bold tracking-widest border-border/60 hover:bg-muted transition-all active:scale-95">
                                <Link href={`/dashboard/chatbots/${bot.id}`}>
                                    View Chatbot
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="w-full h-9 text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <Link href={`/dashboard/chatbots/${bot.id}/playground`}>
                                    Playground <MessageSquare className="ml-2 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors items-center h-20"
        >
            <div className="col-span-4 font-semibold text-sm truncate pr-4 flex items-center gap-2.5">
                <BotIcon className="size-4 text-primary/70 shrink-0" />
                <Link href={`/dashboard/chatbots/${bot.id}`} className="hover:text-primary transition-colors truncate">
                    {bot.name}
                </Link>
            </div>
            <div className="col-span-2">
                <Badge variant="secondary" className="rounded-none uppercase tracking-widest text-[9px] font-bold px-3 py-1.5 border-border/40 w-fit justify-center bg-muted/60">
                    {getPersonaName(bot.botPersona)}
                </Badge>
            </div>
            <div className="col-span-2">
                <Badge variant="outline" className="rounded-none capitalize text-[10px] font-medium px-2 py-0.5 border-border/40 text-muted-foreground whitespace-nowrap">
                    {bot.dataSourceCount || 0} Chunks
                </Badge>
            </div>
            <div className="col-span-3 text-xs text-muted-foreground pr-4 truncate">
                {new Date(bot.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[170px]">
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/dashboard/chatbots/${bot.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/dashboard/chatbots/${bot.id}/playground`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Playground
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => onDelete(bot.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    )
}
