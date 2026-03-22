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
    /*
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

    // ... (helper functions and effects)
    */

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full" />
                <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-blue-500/20 backdrop-blur-sm shadow-2xl">
                    <MessageSquare className="w-16 h-16 text-blue-500 animate-pulse" />
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    Conversation Analytics
                </h1>
                <p className="text-zinc-400 max-w-lg mx-auto text-lg">
                    We are engineering a powerful logging system to help you analyze, search, and improve every conversation your AI has with visitors.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Badge variant="outline" className="px-6 py-1.5 text-sm bg-blue-500/5 text-blue-500 border-blue-500/20 rounded-full">
                    <span className="mr-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Feature in Progress
                </Badge>

                <div className="flex gap-4 pt-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-500">
                        <Inbox className="w-4 h-4 opacity-50" />
                        Historical Logs
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-500">
                        <User className="h-4 w-4 opacity-50" />
                        Session Tracking
                    </div>
                </div>
            </div>

            {/* Existing Implementation Commented Out Below */}
            {/*
            <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-6 w-full">
                ... (full conversation history logic)
            </div>
            */}
        </div>
    );
}
