"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare, User, Bot, Clock, CalendarIcon, Inbox } from "lucide-react";

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

    // Format relative time (e.g., "5m ago", "2h ago", "Oct 12")
    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMins = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMins / 60);
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInMins < 1) return "Just now";
            if (diffInMins < 60) return `${diffInMins}m ago`;
            if (diffInHours < 24) return `${diffInHours}h ago`;
            if (diffInDays < 7) return `${diffInDays}d ago`;

            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
            }).format(date);
        } catch (e) {
            return "";
        }
    };

    const formatFullDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    // Fetch Chat Logs on load
    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/chat/logs`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();

                    setChatLogs(data);
                    setFilteredLogs(data);

                    // Automatically select the first chat if available
                    if (data.length > 0) {
                        handleSelectChat(data[0]._id);
                    }
                } else if (res.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    const errData = await res.json();
                    setError(errData.message || "Failed to fetch chat logs");
                }
            } catch (err) {
                console.error("Error fetching chat logs:", err);
                setError("Network error. Could not connect to the server.");
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [router, API_URL]);

    // Filter logs when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredLogs(chatLogs);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = chatLogs.filter(log =>
                log.sessionId.toLowerCase().includes(query) ||
                (log.lastMessage?.content && log.lastMessage.content.toLowerCase().includes(query))
            );
            setFilteredLogs(filtered);
        }
    }, [searchQuery, chatLogs]);

    const handleSelectChat = async (chatId: string) => {
        if (selectedChatId === chatId) return;

        setSelectedChatId(chatId);
        setLoadingChat(true);
        setFullChat(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/chat/${chatId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setFullChat(data);
            } else {
                console.error("Failed to fetch full chat");
            }
        } catch (err) {
            console.error("Error fetching full chat:", err);
        } finally {
            setLoadingChat(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Chat Logs</h1>
                    <p className="text-muted-foreground text-sm">
                        View and analyze conversations between visitors and your AI assistant.
                    </p>
                </div>
                {error && (
                    <Badge variant="destructive" className="px-3 py-1">
                        {error}
                    </Badge>
                )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
                {/* Left Panel: List of Chat Logs */}
                <Card className="md:col-span-4 lg:col-span-3 flex flex-col h-full overflow-hidden border py-0 gap-0">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Recent Sessions
                        </CardTitle>
                        <div className="relative mt-2 mb-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by session ID or content..."
                                className="pl-8 bg-muted/50 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-y-auto mt-2">
                        {loadingLogs ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                                <Inbox className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No chat sessions found</p>
                                {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 p-3">
                                {filteredLogs.map((log) => (
                                    <button
                                        key={log._id}
                                        onClick={() => handleSelectChat(log._id)}
                                        className={`w-full text-left p-4 rounded-lg border transition-all ${selectedChatId === log._id ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm' : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-200/50 dark:hover:border-zinc-800/50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm truncate pr-2" title={log.sessionId}>
                                                Session: {log.sessionId.length > 15 ? `${log.sessionId.substring(0, 15)}...` : log.sessionId}
                                            </span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(log.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {log.lastMessage?.role === 'user' && <span className="font-semibold text-foreground/70">Visitor: </span>}
                                            {log.lastMessage?.role === 'assistant' && <span className="font-semibold text-foreground/70">AI: </span>}
                                            {log.lastMessage?.content || "No messages yet"}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Full Conversation Details */}
                <Card className="md:col-span-8 lg:col-span-9 flex flex-col h-full overflow-hidden border shadow-sm py-0 gap-0">
                    {loadingChat ? (
                        <div className="flex-1 p-6 flex flex-col space-y-6">
                            <Skeleton className="h-8 w-1/3" />
                            <Separator />
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-3/4 self-end" />
                                <Skeleton className="h-24 w-3/4" />
                                <Skeleton className="h-16 w-3/4 self-end" />
                            </div>
                        </div>
                    ) : fullChat ? (
                        <>
                            <CardHeader className="p-6 border-b bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-row items-center justify-between shadow-sm">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Session ID: <span className="font-normal text-muted-foreground">{fullChat.sessionId}</span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {formatFullDate(fullChat.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" />
                                            {fullChat.messages.length} messages
                                        </span>
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    Active
                                </Badge>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-zinc-50/30 dark:bg-zinc-950/10">
                                {fullChat.messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <p>No messages in this conversation.</p>
                                    </div>
                                ) : (
                                    fullChat.messages.map((msg, idx) => {
                                        const isUser = msg.role === "user";
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                                            >
                                                <Avatar className={`h-8 w-8 shrink-0 ${isUser ? "bg-zinc-900/10 dark:bg-zinc-100/10" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                                                    {isUser ? (
                                                        <AvatarFallback className="bg-zinc-900/10 dark:bg-zinc-100/10 text-zinc-900 dark:text-zinc-100">
                                                            <User className="h-4 w-4" />
                                                        </AvatarFallback>
                                                    ) : (
                                                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                            <Bot className="h-4 w-4" />
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>

                                                <div className={`flex flex-col space-y-1 ${isUser ? "items-end" : "items-start"}`}>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mx-1">
                                                        <span className="font-medium text-foreground">{isUser ? "Visitor" : "PunchAI"}</span>
                                                        <span>{formatFullDate(msg.createdAt).split(", ")[1] || formatTime(msg.createdAt)}</span>
                                                    </div>

                                                    <div className={`px-5 py-3.5 rounded-2xl text-sm ${isUser
                                                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm shadow-sm"
                                                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 dark:text-zinc-100 shadow-sm rounded-tl-sm"
                                                        }`}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/10">
                            <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No Conversation Selected</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Select a session from the list on the left to view the full conversation history.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
