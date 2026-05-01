"use client";

import * as React from "react";
import { Bot, updateBot } from "@/lib/api-session";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Palette,
    MessageSquare,
    ListRestart,
    Loader2,
    Check,
    Plus,
    X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WidgetCustomizerProps {
    bot: Bot;
    onUpdate: (updatedBot: Bot) => void;
}

export function WidgetCustomizer({ bot, onUpdate }: WidgetCustomizerProps) {
    const [welcomeMessage, setWelcomeMessage] = React.useState(bot.welcomeMessage || "Hello! How can I help you today?");
    const [themeColor, setThemeColor] = React.useState(bot.themeColor || "#3b82f6");
    const [chips, setChips] = React.useState<string[]>(
        bot.suggestionChips ? JSON.parse(bot.suggestionChips) : ["What is this?", "How to use?"]
    );
    const [newChip, setNewChip] = React.useState("");
    const [updating, setUpdating] = React.useState(false);

    const handleSave = async () => {
        setUpdating(true);
        try {
            const res = await updateBot(bot.id, {
                welcomeMessage,
                themeColor,
                suggestionChips: JSON.stringify(chips)
            });
            if (res) {
                onUpdate(res);
                toast.success("Widget settings saved");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setUpdating(false);
        }
    };

    const addChip = () => {
        if (newChip.trim() && chips.length < 5) {
            setChips([...chips, newChip.trim()]);
            setNewChip("");
        }
    };

    const removeChip = (index: number) => {
        setChips(chips.filter((_, i) => i !== index));
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
                <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Palette className="text-primary h-5 w-5" />
                            <CardTitle>Branding & Theme</CardTitle>
                        </div>
                        <CardDescription>Customize the visual identity of your chat widget.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Theme Primary Color</Label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-10 border border-border/50"
                                    style={{ backgroundColor: themeColor }}
                                />
                                <Input
                                    type="text"
                                    value={themeColor}
                                    onChange={(e) => setThemeColor(e.target.value)}
                                    className="font-mono uppercase"
                                />
                                <input
                                    type="color"
                                    value={themeColor}
                                    onChange={(e) => setThemeColor(e.target.value)}
                                    className="size-10 cursor-pointer border-0 bg-transparent"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <MessageSquare className="text-primary h-5 w-5" />
                            <CardTitle>Conversation Starters</CardTitle>
                        </div>
                        <CardDescription>Set the initial experience for your users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Welcome Message</Label>
                            <Textarea
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                className="min-h-[100px] resize-none border-border/50 bg-background"
                                placeholder="Hi! I'm your AI assistant..."
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Suggestion Chips (Max 5)</Label>
                                <span className="text-[10px] text-muted-foreground uppercase">{chips.length}/5</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {chips.map((chip, i) => (
                                    <div key={i} className="bg-primary/10 border-primary/20 text-primary flex items-center gap-2 border px-2 py-1 text-xs">
                                        {chip}
                                        <button onClick={() => removeChip(i)}>
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ask about pricing..."
                                    value={newChip}
                                    onChange={(e) => setNewChip(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addChip()}
                                />
                                <Button variant="outline" size="icon" onClick={addChip} className="shrink-0">
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/20 pt-6">
                        <Button onClick={handleSave} disabled={updating} className="w-full rounded-none">
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Widget Settings
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Live Preview */}
            <div className="hidden lg:block">
                <div className="bg-muted/20 sticky top-10 flex flex-col items-center justify-center border-2 border-dashed border-border/40 p-8">
                    <span className="text-muted-foreground mb-4 text-[10px] font-bold tracking-widest uppercase">Live Preview</span>

                    <div className="bg-background shadow-2xl flex h-[500px] w-full max-w-[350px] flex-col border border-border/40 overflow-hidden">
                        <div className="flex items-center justify-between p-4 text-white" style={{ backgroundColor: themeColor }}>
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold">P</div>
                                <span className="text-sm font-bold uppercase tracking-tight">{bot.name}</span>
                            </div>
                            <X className="size-4 opacity-70" />
                        </div>

                        <div className="flex-1 p-4 space-y-4 bg-muted/5">
                            <div className="flex gap-3">
                                <div className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px]">AI</div>
                                <div className="bg-muted/10 border border-border/40 p-3 text-xs leading-relaxed max-w-[80%] rounded-tr-lg rounded-bl-lg rounded-br-lg">
                                    {welcomeMessage}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 pr-2 overflow-x-hidden">
                                {chips.map((chip, i) => (
                                    <div
                                        key={i}
                                        className="border text-[10px] font-medium px-3 py-1.5 rounded-full cursor-not-allowed whitespace-nowrap"
                                        style={{ borderColor: themeColor, color: themeColor }}
                                    >
                                        {chip}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border/40 bg-background flex gap-2">
                            <div className="flex-1 bg-muted/20 h-10 border border-border/40 px-3 flex items-center text-muted-foreground text-[11px]">
                                Type a message...
                            </div>
                            <div className="size-10 flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                                <ListRestart className="size-4" rotate={90} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
