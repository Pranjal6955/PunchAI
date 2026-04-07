"use client"

import { useEffect, useState } from "react";
import { getBots, Bot, deleteBot, getProfile } from "@/lib/api-session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    LayoutGrid,
    List,
    Bot as BotIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";
import { BotCard } from "@/components/dashboard/bot-card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ChatbotsPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [user, setUser] = useState<any>(null);

    const fetchBots = async () => {
        setLoading(true);
        try {
            const profile = await getProfile();
            setUser(profile);
            const data = await getBots();
            setBots(data);
        } catch (error) {
            toast.error("Failed to load agents");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchBots();
    }, []);

    const handleDeleteBot = async (botId: string) => {
        if (!confirm("Are you sure you want to delete this agent? This will also delete all associated messages and data source connections.")) {
            return;
        }

        try {
            const success = await deleteBot(botId);
            if (success) {
                toast.success("Agent deleted successfully");
                setBots(bots.filter(b => b.id !== botId));
            } else {
                toast.error("Failed to delete agent");
            }
        } catch (error) {
            toast.error("An error occurred while deleting");
        }
    };

    const filteredBots = bots.filter(bot => {
        return bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Agents</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your AI chatbots and their retrieval context.
                    </p>
                </div>
                <CreateAgentDialog onSuccess={fetchBots} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-muted/30 p-2 border border-border/40 backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Search agents by name or persona..."
                        className="pl-9 h-10 rounded-none border-border/60 bg-background focus:ring-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

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

            {/* Bots Display */}
            {filteredBots.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent rounded-none shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-16 rounded-none bg-muted flex items-center justify-center mb-6">
                            <BotIcon className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-medium">No agents found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-8">
                            {searchQuery
                                ? "No agents match your current search. Try a different name."
                                : "Get started by creating your first AI agent. Define its personality and connect data sources."
                            }
                        </p>
                        {!searchQuery ? (
                            <CreateAgentDialog onSuccess={fetchBots} />
                        ) : (
                            <Button variant="outline" className="rounded-none" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredBots.map((bot, index) => (
                            <motion.div
                                key={bot.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                            >
                                <BotCard bot={bot} onDelete={handleDeleteBot} viewMode="grid" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="border border-border/60 bg-card overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/60 text-[10px] font-semibold tracking-widest text-muted-foreground bg-muted/30 uppercase">
                        <div className="col-span-6 flex items-center">Agent Name</div>
                        <div className="col-span-2 flex items-center">Sources</div>
                        <div className="col-span-2 flex items-center">Created</div>
                        <div className="col-span-2 flex items-center justify-end">Actions</div>
                    </div>
                    <AnimatePresence mode="popLayout">
                        {filteredBots.map((bot) => (
                            <motion.div
                                key={bot.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <BotCard bot={bot} onDelete={handleDeleteBot} viewMode="list" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
