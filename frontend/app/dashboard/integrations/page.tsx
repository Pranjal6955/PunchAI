"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCcw, Code, Terminal, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { toast } from "sonner"; Silas

export default function IntegrationPage() {
    const [apiKey, setApiKey] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const fetchUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setApiKey(data.apiKey || "");
            }
        } catch (err) {
            console.error("Failed to fetch user", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleRegenerate = async () => {
        const confirmResult = window.confirm(
            "Are you sure you want to regenerate your API key? All applications using the current key will stop working immediately."
        );
        if (!confirmResult) return;

        setRegenerating(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_URL}/user/generate-api-key`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setApiKey(data.apiKey);
                // toast.success("API Key regenerated successfully");
                alert("API Key regenerated successfully");
            } else {
                alert("Failed to regenerate API key");
            }
        } catch (err) {
            console.error(err);
            alert("Error regenerating API key");
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const scriptSnippet = `<script 
  src="https://cdn.punchai.io/widget.js" 
  data-api-key="${apiKey || "YOUR_API_KEY"}"
  async
></script>`;

    const nodeSnippet = `const sendMessage = async (message) => {
  const response = await fetch("${API_URL}/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "${apiKey || "YOUR_API_KEY"}"
    },
    body: JSON.stringify({
      sessionId: "user-session-id",
      message: message
    })
  });
  
  const data = await response.json();
  return data.response;
};`;

    const curlSnippet = `curl -X POST ${API_URL}/chat \\
  -H "x-api-key: ${apiKey || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId": "test-session", "message": "Hello!"}'`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Integration</h1>
                <p className="text-muted-foreground">
                    Connect PunchAI to your website or application using our secure API.
                </p>
            </div>

            {/* API Key Section */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Your API Key</CardTitle>
                            <CardDescription>
                                Used to authenticate your chat widget and direct API calls.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-background">Production</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                value={apiKey}
                                readOnly
                                className="font-mono bg-background pr-10"
                                placeholder="Loading API Key..."
                            />
                            <button
                                onClick={() => copyToClipboard(apiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="bg-background shrink-0"
                        >
                            <RefreshCcw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
                            Regenerate
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Keep this key secret. Never share it or commit it to version control.
                    </p>
                </CardContent>
            </Card>

            {/* Implementation Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Implementation Guide</h2>
                </div>

                <Tabs defaultValue="widget" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                        <TabsTrigger value="widget">Chat Widget</TabsTrigger>
                        <TabsTrigger value="node">Node.js / JS</TabsTrigger>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                    </TabsList>

                    {/* Widget Tab */}
                    <TabsContent value="widget" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Embedded Chat Widget</CardTitle>
                                <CardDescription>
                                    The easiest way to add PunchAI to your website. Copy and paste this script tag into your HTML's <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative group">
                                    <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-300 text-sm overflow-x-auto border border-zinc-800">
                                        <code>{scriptSnippet}</code>
                                    </pre>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-3 top-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(scriptSnippet)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Custom Branding</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Instant Loads</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>Mobile Responsive</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Node.js Tab */}
                    <TabsContent value="node" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Custom Backend Integration</CardTitle>
                                <CardDescription>
                                    Use our REST API to build your own chat interface or integrate with other services.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative group">
                                    <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-300 text-sm overflow-x-auto border border-zinc-800 font-mono">
                                        <code>{nodeSnippet}</code>
                                    </pre>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-3 top-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(nodeSnippet)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CURL Tab */}
                    <TabsContent value="curl" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Terminal / Shell</CardTitle>
                                <CardDescription>
                                    Test your connection directly from your terminal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative group">
                                    <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-300 text-sm overflow-x-auto border border-zinc-800 font-mono">
                                        <code>{curlSnippet}</code>
                                    </pre>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-3 top-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(curlSnippet)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Support Section */}
            <div className="pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-4">
                    <a href="#" className="flex items-center hover:text-foreground transition-colors gap-1">
                        API Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="#" className="flex items-center hover:text-foreground transition-colors gap-1">
                        Developer Forum <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <span>v1.0.0-stable</span>
            </div>
        </div>
    );
}
