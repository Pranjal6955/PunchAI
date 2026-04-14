"use client";

import { useEffect, useState, useMemo } from "react";
import {
    getAllOwnerChats,
    getBots,
    getChat,
    deleteChat,
    Chat,
    Bot,
    Message,
} from "@/lib/api-session";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Search,
    X,
    MessageSquare,
    Globe,
    TrendingUp,
    ChevronDown,
    Trash2,
    ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const SENTIMENT_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    // ── Canonical values ─────────────────────────────────────────────────────
    Happy: {
        label: "Happy",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
    },
    Neutral: {
        label: "Neutral",
        color: "text-foreground/60",
        bg: "bg-muted/50",
    },
    Frustrated: {
        label: "Frustrated",
        color: "text-red-400",
        bg: "bg-red-400/10",
    },
    Curious: {
        label: "Curious",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
    },
    // ── Legacy aliases (old DB rows stored before this fix) ──────────────────
    POSITIVE: { label: "Happy", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    NEGATIVE: { label: "Frustrated", color: "text-red-400", bg: "bg-red-400/10" },
    NEUTRAL: { label: "Neutral", color: "text-foreground/60", bg: "bg-muted/50" },
    CURIOUS: { label: "Curious", color: "text-blue-400", bg: "bg-blue-400/10" },
};

function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
    if (!sentiment) {
        return (
            <span className="text-muted-foreground/40 text-[10px] uppercase tracking-widest">
                —
            </span>
        );
    }
    // Look up exact key first, then try title-cased version as fallback
    const cfg =
        SENTIMENT_CONFIG[sentiment] ??
        SENTIMENT_CONFIG[sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase()] ??
        { label: sentiment, color: "text-muted-foreground", bg: "bg-muted/50" };
    return (
        <span
            className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
                cfg.color,
                cfg.bg,
            )}
        >
            {cfg.label}
        </span>
    );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
}

function MetricCard({ label, value, sub, icon }: MetricCardProps) {
    return (
        <div className="border-border/60 space-y-3 border p-5">
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    {label}
                </span>
                <span className="text-muted-foreground/40">{icon}</span>
            </div>
            <div className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                {value}
            </div>
            {sub && (
                <div className="text-muted-foreground/60 text-xs">{sub}</div>
            )}
        </div>
    );
}

// ─── Conversation Drawer ──────────────────────────────────────────────────────

interface DrawerProps {
    chatId: string | null;
    botName: string;
    onClose: () => void;
}

function ConversationDrawer({ chatId, botName, onClose }: DrawerProps) {
    const [chat, setChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!chatId) return;
        setLoading(true);
        setChat(null);
        getChat(chatId)
            .then(setChat)
            .catch(() => toast.error("Failed to load conversation"))
            .finally(() => setLoading(false));
    }, [chatId]);

    return (
        <AnimatePresence>
            {chatId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    {/* Drawer panel */}
                    <motion.div
                        key="drawer"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="border-border/60 bg-background fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col border-l"
                    >
                        {/* Drawer Header */}
                        <div className="border-border/40 flex items-start justify-between gap-4 border-b px-6 py-5">
                            <div className="min-w-0 space-y-1">
                                <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                                    Conversation
                                </p>
                                {loading ? (
                                    <Skeleton className="h-5 w-48 rounded-none" />
                                ) : (
                                    <h2 className="truncate text-base font-semibold">
                                        {chat?.title ?? "Untitled"}
                                    </h2>
                                )}
                                <p className="text-muted-foreground text-xs">{botName}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Meta strip */}
                        {!loading && chat && (
                            <div className="border-border/40 bg-muted/20 flex flex-wrap items-center gap-x-6 gap-y-1 border-b px-6 py-3">
                                <span className="text-muted-foreground text-xs">
                                    <span className="font-medium text-foreground/80">
                                        {chat.messages?.length ?? 0}
                                    </span>{" "}
                                    messages
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    <span className="font-medium text-foreground/80">
                                        {formatDate(chat.createdAt)}
                                    </span>
                                </span>
                                {chat.sentiment && (
                                    <SentimentBadge sentiment={chat.sentiment} />
                                )}
                                {chat.isExternal && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-blue-400">
                                        <ExternalLink className="h-3 w-3" />
                                        External
                                    </span>
                                )}
                            </div>
                        )}

                        {/* AI Summary */}
                        {!loading && chat?.summary && (
                            <div className="border-border/40 border-b px-6 py-4">
                                <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-widest uppercase">
                                    AI Summary
                                </p>
                                <p className="text-muted-foreground text-sm leading-relaxed italic">
                                    &quot;{chat.summary}&quot;
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex",
                                            i % 2 === 0 ? "justify-start" : "justify-end",
                                        )}
                                    >
                                        <Skeleton
                                            className="h-14 rounded-none"
                                            style={{ width: `${55 + Math.random() * 30}%` }}
                                        />
                                    </div>
                                ))
                            ) : !chat?.messages?.length ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                                    <MessageSquare className="text-muted-foreground/30 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">
                                        No messages in this conversation
                                    </p>
                                </div>
                            ) : (
                                (chat.messages as Message[]).map((msg) => {
                                    const isUser = msg.role === "USER";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col gap-1",
                                                isUser ? "items-end" : "items-start",
                                            )}
                                        >
                                            <span className="text-muted-foreground/50 text-[10px] font-semibold tracking-widest uppercase">
                                                {isUser ? "User" : "Assistant"}
                                            </span>
                                            <div
                                                className={cn(
                                                    "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
                                                    isUser
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/60 text-foreground",
                                                )}
                                            >
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => (
                                                            <p className="mb-2 last:mb-0">{children}</p>
                                                        ),
                                                        strong: ({ children }) => (
                                                            <strong className="font-semibold">{children}</strong>
                                                        ),
                                                        ul: ({ children }) => (
                                                            <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>
                                                        ),
                                                        li: ({ children }) => (
                                                            <li className="leading-relaxed">{children}</li>
                                                        ),
                                                        code: ({ children }) => (
                                                            <code className="bg-black/20 rounded px-1 py-0.5 font-mono text-xs">{children}</code>
                                                        ),
                                                        pre: ({ children }) => (
                                                            <pre className="bg-black/20 mb-2 overflow-x-auto rounded p-3 font-mono text-xs">{children}</pre>
                                                        ),
                                                        h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                            <span className="text-muted-foreground/40 text-[10px]">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Filter / Sort types ──────────────────────────────────────────────────────

type FilterType = "all" | "internal" | "external";
type SortKey = "updatedAt" | "createdAt" | "sentiment";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatLogsPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [sortKey, setSortKey] = useState<SortKey>("updatedAt");

    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchData = async (type: FilterType = filterType) => {
        setLoading(true);
        try {
            const isExternalParam =
                type === "external" ? true : type === "internal" ? false : undefined;
            const [chatData, botData] = await Promise.all([
                getAllOwnerChats(isExternalParam),
                getBots(),
            ]);
            setChats(chatData);
            setBots(botData);
        } catch {
            toast.error("Failed to load chat logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(filterType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType]);

    // ── Bot name lookup ────────────────────────────────────────────────────────
    const botMap = useMemo(
        () => new Map(bots.map((b) => [b.id, b.name])),
        [bots],
    );

    const getBotName = (botId: string) => botMap.get(botId) ?? "Unknown Agent";

    // ── Selected chat bot name ─────────────────────────────────────────────────
    const selectedBotName = useMemo(() => {
        const chat = chats.find((c) => c.id === selectedChatId);
        return chat ? getBotName(chat.botId) : "";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChatId, botMap, chats]);

    // ── Metrics ────────────────────────────────────────────────────────────────
    const totalConversations = chats.length;
    const externalCount = chats.filter((c) => c.isExternal).length;
    const sentiments = chats.filter((c) => c.sentiment);
    const positiveCount = sentiments.filter(
        (c) => c.sentiment?.toUpperCase() === "POSITIVE",
    ).length;
    const sentimentRatio =
        sentiments.length > 0
            ? Math.round((positiveCount / sentiments.length) * 100)
            : null;

    // ── Filtered + sorted list ─────────────────────────────────────────────────
    // isExternal filtering is handled server-side via the API param.
    // Only apply search and sort client-side.
    const displayChats = useMemo(() => {
        let list = [...chats];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (c) =>
                    c.title?.toLowerCase().includes(q) ||
                    getBotName(c.botId).toLowerCase().includes(q) ||
                    c.sentiment?.toLowerCase().includes(q) ||
                    c.summary?.toLowerCase().includes(q),
            );
        }

        list.sort((a, b) => {
            if (sortKey === "sentiment") {
                return (a.sentiment ?? "").localeCompare(b.sentiment ?? "");
            }
            return (
                new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime()
            );
        });

        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, search, sortKey, botMap]);

    // ── Delete handler ─────────────────────────────────────────────────────────
    const handleDelete = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (
            !confirm(
                "Delete this conversation? This action cannot be undone.",
            )
        )
            return;
        setDeletingId(chatId);
        try {
            const ok = await deleteChat(chatId);
            if (ok) {
                setChats((prev) => prev.filter((c) => c.id !== chatId));
                if (selectedChatId === chatId) setSelectedChatId(null);
                toast.success("Conversation deleted");
            } else {
                toast.error("Failed to delete conversation");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setDeletingId(null);
        }
    };

    // ─── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-full w-full space-y-8 p-4 md:p-6 lg:p-8">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-52 rounded-none" />
                    <Skeleton className="h-4 w-72 rounded-none" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border-border/60 space-y-3 border p-5">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-24 rounded-none" />
                                <Skeleton className="h-4 w-4 rounded-none" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-none" />
                            <Skeleton className="h-3 w-32 rounded-none opacity-50" />
                        </div>
                    ))}
                </div>
                <div className="border-border/60 border">
                    <div className="border-border/40 border-b px-6 py-3">
                        <Skeleton className="h-3 w-full rounded-none opacity-40" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="border-border/30 grid grid-cols-12 gap-4 border-b px-6 py-4"
                        >
                            <Skeleton className="col-span-4 h-4 rounded-none" />
                            <Skeleton className="col-span-3 h-4 rounded-none opacity-60" />
                            <Skeleton className="col-span-2 h-4 rounded-none opacity-40" />
                            <Skeleton className="col-span-2 h-4 rounded-none opacity-40" />
                            <Skeleton className="col-span-1 h-4 rounded-none opacity-20" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-full w-full space-y-8 p-4 pb-20 md:p-6 lg:p-8">
                {/* ── Header ─────────────────────────────────────────────────────────── */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Chat Logs
                        </h1>
                        <p className="text-muted-foreground text-base">
                            All conversations across your AI agents.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none"
                        onClick={() => void fetchData(filterType)}
                    >
                        Refresh
                    </Button>
                </div>

                {/* ── Metrics ────────────────────────────────────────────────────────── */}
                <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard
                        label="Total Conversations"
                        value={totalConversations}
                        sub={`Across ${bots.length} agent${bots.length !== 1 ? "s" : ""}`}
                        icon={<MessageSquare className="h-4 w-4" />}
                    />
                    <MetricCard
                        label="External Traffic"
                        value={externalCount}
                        sub={
                            totalConversations > 0
                                ? `${Math.round((externalCount / totalConversations) * 100)}% of all conversations`
                                : "No conversations yet"
                        }
                        icon={<Globe className="h-4 w-4" />}
                    />
                    <MetricCard
                        label="Positive Sentiment"
                        value={
                            sentimentRatio !== null ? `${sentimentRatio}%` : "—"
                        }
                        sub={
                            sentiments.length > 0
                                ? `${sentiments.length} conversations analyzed`
                                : "Not enough data"
                        }
                        icon={<TrendingUp className="h-4 w-4" />}
                    />
                </div>

                {/* ── Toolbar ────────────────────────────────────────────────────────── */}
                <div className="bg-muted/30 border-border/40 flex flex-col items-start justify-between gap-4 border p-2 backdrop-blur-sm lg:flex-row lg:items-center">
                    {/* Search */}
                    <div className="group relative w-full lg:max-w-sm">
                        <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                        <Input
                            placeholder="Search by title, agent, sentiment…"
                            className="border-border/60 bg-background focus-visible:border-primary h-10 rounded-none pl-9 focus:ring-0 focus-visible:ring-0"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter chips */}
                        <div className="border-border/60 bg-background flex border">
                            {(["all", "internal", "external"] as FilterType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterType(f)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                                        filterType === f
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <div className="border-border/60 bg-background relative border">
                            <select
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as SortKey)}
                                className="text-muted-foreground hover:text-foreground appearance-none bg-transparent py-1.5 pl-3 pr-7 text-[10px] font-semibold tracking-widest uppercase transition-colors focus:outline-none"
                            >
                                <option value="updatedAt">Latest Activity</option>
                                <option value="createdAt">Date Created</option>
                                <option value="sentiment">Sentiment</option>
                            </select>
                            <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2" />
                        </div>
                    </div>
                </div>

                {/* ── Table ──────────────────────────────────────────────────────────── */}
                {displayChats.length === 0 ? (
                    <div className="border-border/40 flex flex-col items-center justify-center gap-3 border border-dashed py-24 text-center">
                        <MessageSquare className="text-muted-foreground/30 h-10 w-10" />
                        <h3 className="text-lg font-medium">No conversations found</h3>
                        <p className="text-muted-foreground max-w-sm text-sm">
                            {search || filterType !== "all"
                                ? "Try changing your search or filter."
                                : "Conversations will appear here once users start chatting with your agents."}
                        </p>
                    </div>
                ) : (
                    <div className="border-border/60 overflow-hidden border">
                        {/* Table header */}
                        <div className="border-border/60 text-muted-foreground bg-muted/30 grid grid-cols-12 gap-4 border-b px-6 py-3 text-[10px] font-semibold tracking-widest uppercase">
                            <div className="col-span-4">Title / Agent</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Sentiment</div>
                            <div className="col-span-2">Last Active</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Table rows */}
                        <AnimatePresence initial={false}>
                            {displayChats.map((chat, index) => (
                                <motion.div
                                    key={chat.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.15, delay: index * 0.02 }}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className={cn(
                                        "border-border/30 hover:bg-muted/30 grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors",
                                        selectedChatId === chat.id && "bg-muted/20",
                                    )}
                                >
                                    {/* Title + agent */}
                                    <div className="col-span-4 min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {chat.title ?? "Untitled Conversation"}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {getBotName(chat.botId)}
                                        </p>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2">
                                        {chat.isExternal ? (
                                            <Badge
                                                variant="outline"
                                                className="rounded-none border-blue-400/30 bg-blue-400/10 text-[10px] font-semibold tracking-widest text-blue-400 uppercase"
                                            >
                                                External
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="text-muted-foreground rounded-none text-[10px] font-semibold tracking-widest uppercase"
                                            >
                                                Internal
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Sentiment */}
                                    <div className="col-span-2">
                                        <SentimentBadge sentiment={chat.sentiment} />
                                    </div>

                                    {/* Last active */}
                                    <div className="col-span-2">
                                        <p className="text-sm">{relativeTime(chat.updatedAt)}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {formatDate(chat.updatedAt)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-none"
                                            onClick={(e) => void handleDelete(chat.id, e)}
                                            disabled={deletingId === chat.id}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Footer count */}
                        <div className="border-border/40 text-muted-foreground/60 flex items-center justify-between border-t px-6 py-3 text-xs">
                            <span>
                                Showing {displayChats.length} of {totalConversations} conversations
                            </span>
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                    Clear search
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Slide-over drawer ────────────────────────────────────────────────── */}
            <ConversationDrawer
                chatId={selectedChatId}
                botName={selectedBotName}
                onClose={() => setSelectedChatId(null)}
            />
        </>
    );
}
