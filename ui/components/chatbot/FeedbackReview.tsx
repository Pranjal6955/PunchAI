"use client";

import * as React from "react";
import { Message, getNegativeFeedbackMessages, createFaq } from "@/lib/api-session";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    MessageSquare,
    CheckCircle2,
    Trash2,
    ExternalLink,
    ShieldAlert,
    Loader2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackReviewProps {
    botId: string;
}

export function FeedbackReview({ botId }: FeedbackReviewProps) {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [expandedId, setExpandedId] = React.useState<string | null>(null);
    const [overriding, setOverriding] = React.useState<string | null>(null);
    const [overrideText, setOverrideText] = React.useState("");

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNegativeFeedbackMessages(botId);
            setMessages(data);
        } catch (error) {
            toast.error("Failed to load feedback");
        } finally {
            setLoading(false);
        }
    }, [botId]);

    React.useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const handleOverride = async (msg: Message) => {
        if (!overrideText.trim()) return;
        setOverriding(msg.id);
        try {
            // Find the user query that preceded this assistant message
            // Note: In this view, we might not have the full chat history easily available
            // but we can assume the user wants to override for the context of this specific message's prompt

            const success = await createFaq(botId, "Identify query for: " + msg.content.slice(0, 50), overrideText);
            if (success) {
                toast.success("Knowledge base override created");
                setExpandedId(null);
            }
        } catch (error) {
            toast.error("Failed to create override");
        } finally {
            setOverriding(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground tracking-widest uppercase">Analyzing Feedback...</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <Card className="bg-muted/10 border-dashed rounded-none">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-4" />
                    <p className="text-lg font-semibold tracking-tight">Zero Negative Feedback</p>
                    <CardDescription className="max-w-[300px]">
                        Your agent is performing exceptionally well! No negative reports found for this bot.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">HITL Review Center</h2>
                    <p className="text-sm text-muted-foreground">Monitor and correct AI responses based on user feedback.</p>
                </div>
                <Badge variant="outline" className="rounded-none border-red-500/20 bg-red-500/10 text-red-500 px-3 py-1">
                    {messages.length} Critical Issues
                </Badge>
            </div>

            <div className="grid gap-4">
                {messages.map((msg) => {
                    const isExpanded = expandedId === msg.id;
                    const chunks = msg.metadata?.chunks as any[] || [];

                    return (
                        <Card
                            key={msg.id}
                            className={`rounded-none border-border/50 transition-all ${isExpanded ? 'ring-1 ring-primary/20' : 'hover:border-primary/20'}`}
                        >
                            <div
                                className="p-4 cursor-pointer flex items-center justify-between"
                                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="bg-red-500/10 p-2 text-red-500">
                                        <ShieldAlert className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate pr-4 italic">
                                            "{msg.content.slice(0, 100)}..."
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">
                                            {new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(msg.createdAt))}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {chunks.length} Sources
                                    </Badge>
                                    {isExpanded ? <ChevronUp className="size-4 opacity-50" /> : <ChevronDown className="size-4 opacity-50" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <CardContent className="border-t border-border/20 pt-6 space-y-6 bg-muted/5 animate-in slide-in-from-top-1 duration-200">
                                    <div className="grid lg:grid-cols-2 gap-8">
                                        {/* Left side: Problem */}
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">The Response</Label>
                                            <div className="bg-background border border-border/50 p-4 text-sm leading-relaxed rounded-none shadow-sm italic">
                                                {msg.content}
                                            </div>

                                            <Label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-6 block">Retrieved Sources</Label>
                                            <div className="space-y-2">
                                                {chunks.length > 0 ? chunks.slice(0, 2).map((c, i) => (
                                                    <div key={i} className="text-[11px] bg-muted/20 border border-border/30 p-2 text-muted-foreground line-clamp-3">
                                                        {c.content}
                                                    </div>
                                                )) : (
                                                    <p className="text-xs text-muted-foreground italic">No context was retrieved for this message.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side: Human Correction */}
                                        <div className="space-y-4">
                                            <Label className="text-primary text-[10px] font-bold tracking-widest uppercase">Human Correction (Faq Override)</Label>
                                            <Textarea
                                                placeholder="Enter the correct information to be added to the knowledge base..."
                                                className="min-h-[150px] bg-background border-primary/20 focus:border-primary/50 text-sm"
                                                value={overrideText}
                                                onChange={(e) => setOverrideText(e.target.value)}
                                            />
                                            <Button
                                                className="w-full rounded-none h-11"
                                                disabled={!overrideText.trim() || overriding === msg.id}
                                                onClick={() => handleOverride(msg)}
                                            >
                                                {overriding === msg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                Apply Correction to Knowledge Base
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground text-center italic">
                                                Applying this correction will create a high-priority FAQ that ensures the agent gives this specific answer in the future.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function Label({ children, className, ...props }: React.ComponentProps<"label">) {
    return (
        <label className={cn("text-sm font-medium leading-none", className)} {...props}>
            {children}
        </label>
    );
}
