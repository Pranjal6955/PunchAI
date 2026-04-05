"use client"

import { useEffect, useState } from "react";
import { getBots, Bot, deleteBot } from "@/lib/api-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    MoreVertical,
    Trash2,
    ExternalLink,
    Filter,
    Bot as BotIcon,
    Code2,
    MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CreateBotDialog } from "@/components/chatbot/create-bot-dialog";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { ChatbotBlock, getPersonaName } from "@/components/chatbot/chatbot-block";

export default function BotsPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [personaFilter, setPersonaFilter] = useState<string>("all");

    const fetchBots = async () => {
        setLoading(true);
        try {
            const data = await getBots();
            setBots(data);
        } catch (error) {
            toast.error("Failed to load chatbots");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchBots();
    }, []);

    const handleDeleteBot = async (botId: string) => {
        if (!confirm("Are you sure you want to delete this chatbot? This action cannot be undone.")) {
            return;
        }

        try {
            const success = await deleteBot(botId);
            if (success) {
                toast.success("Chatbot deleted successfully");
                setBots(bots.filter(p => p.id !== botId));
            } else {
                toast.error("Failed to delete chatbot");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = personaFilter === "all" || getPersonaName(bot.botPersona) === personaFilter;
        return matchesSearch && matchesFilter;
    });

    const uniquePersonaNames = Array.from(new Set(bots.map(p => getPersonaName(p.botPersona))));

    if (loading && bots.length === 0) {
        return (
            <div className="p-4 space-y-8 w-full min-h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48 rounded-none" />
                        <Skeleton className="h-4 w-64 rounded-none" />
                    </div>
                    <Skeleton className="h-10 w-36 rounded-none" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 flex-1 rounded-none" />
                    <Skeleton className="h-10 w-32 rounded-none" />
                    <Skeleton className="h-10 w-24 rounded-none" />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-none" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8 w-full min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Chatbots</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your AI agents and their personalities.
                    </p>
                </div>
                <CreateBotDialog onSuccess={fetchBots} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-muted/30 p-2 border border-border/40 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Search chatbots by name or description..."
                        className="pl-9 h-10 rounded-none border-border/60 bg-background focus:ring-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-none border-border/60 h-10 px-4 shrink-0 shadow-none gap-2">
                                <Filter className="mr-1 h-4 w-4" />
                                {personaFilter === "all" ? "All Personas" : personaFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-border/60 min-w-[180px]">
                            <DropdownMenuItem onClick={() => setPersonaFilter("all")} className="cursor-pointer">
                                All Personas
                            </DropdownMenuItem>
                            {uniquePersonaNames.map(name => (
                                <DropdownMenuItem key={name} onClick={() => setPersonaFilter(name)} className="cursor-pointer gap-2">
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex border border-border/60 p-0.5 shrink-0 bg-background">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-none shadow-none"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-none shadow-none"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chatbots Display */}
            {filteredBots.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent rounded-none shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-none bg-muted flex items-center justify-center mb-6">
                            <BotIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-medium">No chatbots found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-8">
                            {searchQuery || personaFilter !== "all"
                                ? "No chatbots match your current search or filter criteria. Try adjusting them."
                                : "Get started by creating your first chatbot to interact with your data."
                            }
                        </p>
                        {!searchQuery && personaFilter === "all" ? (
                            <CreateBotDialog onSuccess={fetchBots} />
                        ) : (
                            <Button variant="outline" className="rounded-none" onClick={() => { setSearchQuery(""); setPersonaFilter("all"); }}>
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredBots.map((bot, index) => (
                            <ChatbotBlock
                                key={bot.id}
                                bot={bot}
                                viewMode="grid"
                                index={index}
                                onDelete={handleDeleteBot}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="border border-border/60 bg-card overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 text-[10px] font-semibold tracking-widest text-muted-foreground bg-muted/30">
                        <div className="col-span-5 flex items-center">Chatbot Name</div>
                        <div className="col-span-2 flex items-center">Persona</div>
                        <div className="col-span-2 flex items-center">Sources</div>
                        <div className="col-span-2 flex items-center">Created</div>
                        <div className="col-span-1 flex items-center justify-end">Actions</div>
                    </div>
                    <AnimatePresence mode="popLayout">
                        {filteredBots.map((bot, index) => (
                            <ChatbotBlock
                                key={bot.id}
                                bot={bot}
                                viewMode="list"
                                index={index}
                                onDelete={handleDeleteBot}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
