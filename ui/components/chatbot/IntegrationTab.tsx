"use client"

import * as React from "react";
import { Bot } from "@/lib/api-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Code2, Terminal, Copy, ExternalLink, ShieldCheck, Zap,
    Eye, EyeOff, Loader2, FileText, Palette, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface IntegrationTabProps {
    bot: Bot;
    customCss: string;
    setCustomCss: (val: string) => void;
    handleUpdate: () => Promise<void>;
    updating: boolean;
    showApiKey: boolean;
    setShowApiKey: (val: boolean) => void;
    handleGenerateApiKey: () => Promise<void>;
    defaultCss: string;
}

export function IntegrationTab({
    bot,
    customCss,
    setCustomCss,
    handleUpdate,
    updating,
    showApiKey,
    setShowApiKey,
    handleGenerateApiKey,
    defaultCss
}: IntegrationTabProps) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <div className="space-y-8">


            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="rounded-none border shadow-sm bg-muted/40 border-border/50">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 text-primary">
                                <Code2 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Embed Widget</CardTitle>
                        </div>
                        <CardDescription>
                            Add this script tag to your website's <code className="text-primary font-mono">&lt;head&gt;</code> or <code className="text-primary font-mono">&lt;body&gt;</code> tag to enable the chatbot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Widget Script Tag</Label>
                            <div className="relative group">
                                <pre className="p-4 bg-black text-white font-mono text-sm overflow-x-auto border border-white/10 select-all leading-relaxed">
                                    {`<script 
  src="${origin}/widget/punch-chat.js"
  data-api-key="${(bot.apiKey && showApiKey) ? bot.apiKey : (bot.apiKey ? '••••••••••••••••' : 'YOUR_API_KEY')}"
  data-base-url="http://localhost:8000"
></script>`}
                                </pre>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-2 right-2 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        const code = `<script \n  src="${origin}/widget/punch-chat.js"\n  data-api-key="${bot.apiKey || 'YOUR_API_KEY'}"\n  data-base-url="http://localhost:8000"\n></script>`;
                                        navigator.clipboard.writeText(code);
                                        toast.success("Script tag copied to clipboard");
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-sm font-semibold">Security Tip</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Your API key identifies this specific agent. Keep it secure and only embed it on domains you trust.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none border shadow-sm bg-muted/40 border-border/50">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 text-primary">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Direct API Access</CardTitle>
                        </div>
                        <CardDescription>
                            Interact with your agent programmatically via our REST API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Public API Key</Label>
                                {bot.apiKey && (
                                    <Badge variant="outline" className="rounded-none text-[10px] uppercase font-bold tracking-tighter bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        Active
                                    </Badge>
                                )}
                            </div>

                            {bot.apiKey ? (
                                <div className="flex gap-2 p-1.5 bg-background border border-border/50 group transition-all hover:border-primary/30">
                                    <div className="flex-1 flex items-center px-3 font-mono text-sm overflow-hidden whitespace-nowrap text-muted-foreground select-none">
                                        {showApiKey ? (
                                            <span className="text-foreground">{bot.apiKey}</span>
                                        ) : (
                                            <span>•••••••••••••••••••••••••••••</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-none h-9 w-9"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            title={showApiKey ? "Hide API Key" : "Show API Key"}
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-none h-9 w-9"
                                            onClick={() => {
                                                navigator.clipboard.writeText(bot.apiKey || "");
                                                toast.success("API Key copied");
                                            }}
                                            title="Copy Key"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center text-center space-y-4 transition-colors hover:bg-muted/30">
                                    <div className="p-4 bg-background border border-border/50 shadow-sm">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-1 max-w-[280px]">
                                        <p className="text-sm font-semibold">No API Key Generated</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            You need an API key to securely connect this agent to your external applications and widgets.
                                        </p>
                                    </div>
                                    <Button
                                        variant="default"
                                        className="rounded-none px-10 h-11"
                                        onClick={handleGenerateApiKey}
                                        disabled={updating}
                                    >
                                        {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate API Key
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Test (cURL)</Label>
                            <pre className="p-4 bg-muted border border-border/50 font-mono text-xs overflow-x-auto leading-relaxed">
                                {`curl -X POST http://localhost:8000/api/external/chat/init \\
  -H "X-API-Key: ${(bot.apiKey && showApiKey) ? bot.apiKey : (bot.apiKey ? '••••••••••••••••' : 'YOUR_API_KEY')}"`}
                            </pre>
                        </div>

                        <div className="flex justify-end">
                            <Link href="/docs" target="_blank">
                                <Button variant="link" className="text-xs">
                                    View Full API Documentation
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-none border shadow-sm bg-muted/40 border-border/50 lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 text-primary">
                                <Palette className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Custom CSS Styling (style.css)</CardTitle>
                        </div>
                        <CardDescription>
                            Customize the widget's appearance to match your brand. Click "Save Custom Style" to apply changes to your live widget.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative group">
                            <Textarea
                                value={customCss}
                                onChange={(e) => setCustomCss(e.target.value)}
                                className="min-h-[300px] bg-black text-white font-mono text-sm border-white/10 rounded-none focus:border-white/20 p-6 leading-relaxed resize-y"
                                placeholder="Paste your custom CSS here..."
                            />
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-4 right-4 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    navigator.clipboard.writeText(customCss);
                                    toast.success("CSS copied to clipboard");
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleUpdate()}
                                    disabled={updating}
                                    className="rounded-none px-6"
                                >
                                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Custom Style
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-none px-6"
                                    onClick={() => setCustomCss(defaultCss)}
                                >
                                    Reset to Default
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                className="rounded-none text-xs h-9"
                                onClick={() => {
                                    const blob = new Blob([customCss], { type: 'text/css' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'style.css';
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    toast.success("style.css download started");
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Download style.css
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="max-w-4xl w-full pt-4">
                <Card className="rounded-none border shadow-sm bg-primary/5 border-primary/20">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary text-primary-foreground">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Quick Start: Integration Guide</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-8 relative">
                            {/* Vertical line through steps */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5" />

                            {[
                                { step: "01", title: "Configuration Check", desc: "Before embedding, ensure you have added at least one Data Source. The widget requires an active knowledge base to respond to user queries effectively." },
                                { step: "02", title: "API Key Authentication", desc: "Generate your unique API Key. This secures your agent and ensures only authorized sites can load your specific configuration." },
                                { step: "03", title: "Script Placement", desc: "Insert the widget <script> tag into your website's HTML. We recommend placing it just before the </body> closing tag to ensure faster initial page load." },
                                { step: "04", title: "Style Override & CDN", desc: "If you've customized styles, those rules are injected automatically. You can also download the style.css to host it locally for advanced performance tuning." },
                                { step: "05", title: "Deployment Verification", desc: "Refresh your website and test the chat. Use the 'Quick Test' cURL command in this dashboard to confirm that the backend is responding correctly." }
                            ].map((m, idx) => (
                                <div key={m.step} className="flex gap-8 group relative pl-12">
                                    <div className="absolute left-0 top-0 z-10 flex items-center justify-center w-10 h-10 bg-background border-2 border-primary/20 text-primary font-black text-xs transition-colors group-hover:border-primary">
                                        {m.step}
                                    </div>
                                    <div className="space-y-1 py-1">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                                            {m.title}
                                            <div className="h-px flex-1 bg-primary/5 w-12" />
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl italic pr-12">
                                            {m.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
