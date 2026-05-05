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
import { Slider } from "@/components/ui/slider";
import {
    Palette,
    MessageSquare,
    ListRestart,
    Loader2,
    Check,
    Plus,
    X,
    Maximize2,
    Layout
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
    const [widgetWidth, setWidgetWidth] = React.useState(bot.widgetWidth || "350");
    const [widgetBorderRadius, setWidgetBorderRadius] = React.useState(bot.widgetBorderRadius || 12);
    const [userBorderRadius, setUserBorderRadius] = React.useState(bot.userBorderRadius || 12);
    const [assistantBorderRadius, setAssistantBorderRadius] = React.useState(bot.assistantBorderRadius || 12);
    const [userChatBg, setUserChatBg] = React.useState(bot.userChatBg || "#3b82f6");
    const [assistantChatBg, setAssistantChatBg] = React.useState(bot.assistantChatBg || "#f3f4f6");

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
                widgetWidth,
                widgetBorderRadius,
                userBorderRadius,
                assistantBorderRadius,
                userChatBg,
                assistantChatBg,
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label>Theme Primary Color</Label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="size-10 cursor-pointer border-0 bg-transparent shrink-0"
                                    />
                                    <Input
                                        type="text"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="font-mono uppercase h-10 rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Widget Width (px)</Label>
                                <div className="flex flex-col gap-4 pt-2">
                                    <Slider
                                        value={[parseInt(widgetWidth)]}
                                        min={300}
                                        max={600}
                                        step={10}
                                        onValueChange={(val) => setWidgetWidth(val[0].toString())}
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                        <span>300px</span>
                                        <span className="text-primary">{widgetWidth}px</span>
                                        <span>600px</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Widget Border Radius (px)</Label>
                            <div className="flex flex-col gap-4 pt-2">
                                <Slider
                                    value={[widgetBorderRadius]}
                                    min={0}
                                    max={24}
                                    step={2}
                                    onValueChange={(val) => setWidgetBorderRadius(val[0])}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                    <span>Sharp</span>
                                    <span className="text-primary">{widgetBorderRadius}px</span>
                                    <span>Rounded</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Layout className="text-primary h-5 w-5" />
                            <CardTitle>Chat Bubbles</CardTitle>
                        </div>
                        <CardDescription>Customize the look of messages.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label>User Message Background</Label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={userChatBg}
                                        onChange={(e) => setUserChatBg(e.target.value)}
                                        className="size-10 cursor-pointer border-0 bg-transparent shrink-0"
                                    />
                                    <Input
                                        type="text"
                                        value={userChatBg}
                                        onChange={(e) => setUserChatBg(e.target.value)}
                                        className="font-mono uppercase h-10 rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Assistant Message Background</Label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={assistantChatBg}
                                        onChange={(e) => setAssistantChatBg(e.target.value)}
                                        className="size-10 cursor-pointer border-0 bg-transparent shrink-0"
                                    />
                                    <Input
                                        type="text"
                                        value={assistantChatBg}
                                        onChange={(e) => setAssistantChatBg(e.target.value)}
                                        className="font-mono uppercase h-10 rounded-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label>User Bubble Radius (px)</Label>
                                <div className="flex flex-col gap-4 pt-2">
                                    <Slider
                                        value={[userBorderRadius]}
                                        min={0}
                                        max={24}
                                        step={2}
                                        onValueChange={(val) => setUserBorderRadius(val[0])}
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                        <span>0px</span>
                                        <span className="text-primary">{userBorderRadius}px</span>
                                        <span>24px</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Assistant Bubble Radius (px)</Label>
                                <div className="flex flex-col gap-4 pt-2">
                                    <Slider
                                        value={[assistantBorderRadius]}
                                        min={0}
                                        max={24}
                                        step={2}
                                        onValueChange={(val) => setAssistantBorderRadius(val[0])}
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                        <span>0px</span>
                                        <span className="text-primary">{assistantBorderRadius}px</span>
                                        <span>24px</span>
                                    </div>
                                </div>
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
                                className="min-h-[100px] resize-none border-border/50 bg-background rounded-none"
                                placeholder="Hi! I'm your AI assistant..."
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Suggestion Chips (Max 5)</Label>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">{chips.length}/5</span>
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
                                    className="rounded-none"
                                />
                                <Button variant="outline" size="icon" onClick={addChip} className="shrink-0 rounded-none">
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/20 pt-6">
                        <Button onClick={handleSave} disabled={updating} className="w-full h-11 rounded-none font-bold uppercase tracking-widest">
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Widget Settings
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Live Preview */}
            <div className="hidden lg:block relative">
                <div className="bg-muted/10 sticky top-10 flex flex-col items-center justify-center border-2 border-dashed border-border/40 p-10 min-h-[700px]">
                    <div className="absolute top-4 left-6 flex items-center gap-2">
                        <Maximize2 className="size-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">Live Workspace</span>
                    </div>

                    <div 
                        className="bg-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex h-[600px] flex-col border border-border/40 overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ 
                            width: `${widgetWidth}px`,
                            borderRadius: `${widgetBorderRadius}px`
                        }}
                    >
                        <div className="flex items-center justify-between p-4 text-white" style={{ backgroundColor: themeColor }}>
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-bold">P</div>
                                <span className="text-sm font-bold uppercase tracking-tight">{bot.name}</span>
                            </div>
                            <X className="size-4 opacity-70" />
                        </div>

                        <div className="flex-1 p-5 space-y-6 bg-muted/5 overflow-y-auto">
                            {/* Assistant Message */}
                            <div className="flex gap-3">
                                <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">AI</div>
                                <div 
                                    className="p-4 text-xs leading-relaxed max-w-[85%] shadow-sm"
                                    style={{ 
                                        backgroundColor: assistantChatBg,
                                        borderRadius: `${assistantBorderRadius}px`,
                                        borderTopLeftRadius: '2px',
                                        color: assistantChatBg === "#f3f4f6" ? "inherit" : "#fff"
                                    }}
                                >
                                    {welcomeMessage}
                                </div>
                            </div>

                            {/* User Message Example */}
                            <div className="flex flex-col items-end gap-2">
                                <div 
                                    className="p-4 text-xs leading-relaxed max-w-[85%] text-white shadow-sm"
                                    style={{ 
                                        backgroundColor: userChatBg,
                                        borderRadius: `${userBorderRadius}px`,
                                        borderTopRightRadius: '2px'
                                    }}
                                >
                                    How can I integrate this into my Next.js app?
                                </div>
                                <span className="text-[9px] text-muted-foreground uppercase mr-1">Just now</span>
                            </div>

                            <div className="flex flex-col items-end gap-2 pr-2">
                                {chips.map((chip, i) => (
                                    <div
                                        key={i}
                                        className="border text-[10px] font-bold px-4 py-2 rounded-full cursor-not-allowed whitespace-nowrap bg-background transition-colors"
                                        style={{ borderColor: themeColor, color: themeColor }}
                                    >
                                        {chip}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border/20 bg-background flex gap-2">
                            <div className="flex-1 bg-muted/20 h-11 border border-border/40 px-4 flex items-center text-muted-foreground text-[11px]">
                                Type your message...
                            </div>
                            <div className="size-11 flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: themeColor, borderRadius: `${widgetBorderRadius / 2}px` }}>
                                <ListRestart className="size-5" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-6 text-muted-foreground">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold uppercase">Desktop</span>
                            <div className="h-1 w-8 bg-primary rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-[10px] font-bold uppercase">Mobile</span>
                            <div className="h-1 w-8 bg-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
