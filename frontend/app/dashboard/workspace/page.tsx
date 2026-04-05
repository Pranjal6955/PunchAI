"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Search, Command, FolderOpen, Loader2, Database, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBots, Bot } from "@/lib/api-session";
import { CreateApiDialog } from "@/components/create-api-dialog";

export default function WorkspacePage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [selectedBot, setSelectedBot] = useState<string>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBots = async () => {
            setIsLoading(true);
            try {
                const data = await getBots();
                setBots(data);
                if (data.length > 0 && !selectedBot) {
                    setSelectedBot(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch chatbots:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBots();
    }, []);

    return (
        <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
            {/* Dotted Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />

            {/* Content Wrapper */}
            <div className="relative z-10 p-6 lg:p-8 flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-1.5 text-left">
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Data Source</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            Monitor live traffic, test endpoints, and debug request/response cycles in real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={selectedBot} onValueChange={setSelectedBot}>
                            <SelectTrigger className="w-[240px] h-11 rounded-none border-border/60 bg-background/50 backdrop-blur-md px-4 hover:border-primary/30 transition-all shadow-xl shadow-primary/5">
                                <div className="flex items-center gap-2.5">
                                    {isLoading ? (
                                        <Loader2 className="size-4 text-primary animate-spin" />
                                    ) : (
                                        <FolderOpen className="size-4 text-primary" />
                                    )}
                                    <SelectValue placeholder={isLoading ? "Loading..." : "Select Chatbot"} />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-border/60 bg-background/95 backdrop-blur-xl">
                                {bots.length === 0 && !isLoading ? (
                                    <div className="p-4 text-xs text-muted-foreground text-center">No chatbots found</div>
                                ) : (
                                    bots.map((bot) => (
                                        <SelectItem
                                            key={bot.id}
                                            value={bot.id}
                                            className="rounded-none focus:bg-primary/10 focus:text-primary"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{bot.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <CreateApiDialog botId={selectedBot} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 h-full min-h-[500px]">
                    <Card className="rounded-none border-border/60 bg-background/50 backdrop-blur-md shadow-2xl shadow-primary/5 h-full flex flex-col overflow-hidden group hover:border-primary/30 transition-all duration-300">
                        <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
                                    <div className="size-7 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Settings2 className="size-4 text-primary" />
                                    </div>
                                    Quick Test Interface
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-muted text-[10px] uppercase tracking-tighter font-bold text-muted-foreground">
                                    <Command className="size-3" />
                                    K
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative min-h-[400px]">
                            {/* Request Input Area */}
                            <div className="p-6 border-b border-border/40">
                                <div className="flex gap-2 mb-4">
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Search className="size-4" />
                                        </div>
                                        <Input
                                            placeholder="Enter endpoint path to test..."
                                            className="pl-10 h-10 rounded-none border-border/60 bg-background/80 focus-visible:ring-0 focus-visible:border-primary transition-all duration-300"
                                        />
                                    </div>
                                    <Button className="rounded-none h-10 px-6 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                                        <Play className="size-3.5 fill-current" />
                                        SEND
                                    </Button>
                                </div>
                            </div>

                            {/* Results Area Placeholder */}
                            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50 select-none h-full">
                                <div className="size-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border/60">
                                    <Database className="size-8 text-muted-foreground/60" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Capture incoming data</p>
                                    <p className="text-xs text-muted-foreground max-w-[240px]">Create an API endpoint and send a request to see real-time data inspection.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
