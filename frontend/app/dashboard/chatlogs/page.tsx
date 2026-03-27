"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare, User, Bot, Clock, CalendarIcon, Inbox, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Types
type ChatLogSummary = {
    _id: string;
    sessionId: string;
    lastMessage?: {
        role: "user" | "assistant" | "system";
        content: string;
        createdAt: string;
    };
    messageCount: number;
    updatedAt: string;
};

type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
};

type FullChat = {
    _id: string;
    userId: string;
    sessionId: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
};

export default function ChatLogsPage() {
    const router = useRouter();
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatLogs, setChatLogs] = useState<ChatLogSummary[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ChatLogSummary[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [fullChat, setFullChat] = useState<FullChat | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/chat/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChatLogs(data);
                setFilteredLogs(data);
            } else {
                setError("Failed to load chat logs");
            }
        } catch (err) {
            setError("Error connecting to server");
        } finally {
            setLoadingLogs(false);
        }
    }, [API_URL]);

    const fetchFullChat = async (id: string) => {
        setLoadingChat(true);
        setSelectedChatId(id);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/chat/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFullChat(data);
            }
        } catch (err) {
            console.error("Error fetching full chat", err);
        } finally {
            setLoadingChat(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        setFilteredLogs(
            chatLogs.filter(log =>
                log.sessionId.toLowerCase().includes(lowerQuery) ||
                log.lastMessage?.content.toLowerCase().includes(lowerQuery)
            )
        );
    }, [searchQuery, chatLogs]);

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 p-6 w-full text-foreground">
            {/* ── Left Sidebar: Chat List ───────────────────────────────────── */}
            <Card className="w-1/3 flex flex-col border-border bg-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Conversations
                    </CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sessions or messages..."
                            className="pl-9 bg-muted/50 border-border"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto p-0">
                    {loadingLogs ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="flex flex-col">
                            {filteredLogs.map((log) => (
                                <button
                                    key={log._id}
                                    onClick={() => fetchFullChat(log._id)}
                                    className={`flex flex-col gap-1 p-4 text-left border-b border-border transition-colors hover:bg-muted/50 ${selectedChatId === log._id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                                            {log.sessionId}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground flex items-center whitespace-nowrap">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium line-clamp-1 text-foreground/90">
                                        {log.lastMessage?.content || "No messages yet"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-muted text-muted-foreground font-normal">
                                            {log.messageCount} messages
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                            <Inbox className="w-8 h-8 text-muted-foreground mb-2 opacity-20" />
                            <p className="text-sm text-muted-foreground">No conversations found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Right Content: Conversation View ──────────────────────────── */}
            <Card className="flex-grow flex flex-col border-border bg-card">
                {selectedChatId ? (
                    <>
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Session: <span className="font-mono text-primary">{fullChat?.sessionId || selectedChatId}</span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        Started on {fullChat ? new Date(fullChat.createdAt).toLocaleString() : "..."}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/5 border-emerald-500/20">
                                    Active Session
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-auto p-0 relative">
                            <div className="h-full p-6">
                                {loadingChat ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-end"><Skeleton className="h-10 w-2/3 rounded-2xl rounded-tr-none" /></div>
                                        <div className="flex justify-start"><Skeleton className="h-20 w-3/4 rounded-2xl rounded-tl-none" /></div>
                                        <div className="flex justify-end"><Skeleton className="h-12 w-1/2 rounded-2xl rounded-tr-none" /></div>
                                    </div>
                                ) : fullChat ? (
                                    <div className="space-y-6 pb-4">
                                        {fullChat.messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <Avatar className="h-8 w-8 shrink-0 mt-1 border border-border">
                                                        <AvatarFallback className={msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}>
                                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={`space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div
                                                            className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                                : 'bg-muted/50 border border-border rounded-tl-none text-foreground'
                                                                }`}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground px-1">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-12">
                        <div className="p-6 rounded-full bg-muted/30 border border-border mb-4">
                            <MessageSquare className="w-10 h-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Choose a session from the list to view the full chat history and analyze user interactions.
                        </p>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

