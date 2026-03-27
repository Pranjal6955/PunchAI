"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, RefreshCcw, Code, Check, ExternalLink, Key, ShieldCheck, ShieldOff, AlertTriangle, Eye, EyeOff, Trash2, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type KeyType = "primary" | "fallback";

interface KeySlot {
    active: boolean;
    createdAt: string | null;
    revealedKey: string | null; // set only right after generation
    revealed: boolean;
    loading: boolean;
    copied: boolean;
}

const EMPTY_SLOT: KeySlot = {
    active: false, createdAt: null,
    revealedKey: null, revealed: false,
    loading: false, copied: false,
};

const mask = (k: string) => k.slice(0, 10) + "•".repeat(24) + k.slice(-4);

export default function IntegrationPage() {
    const [primary, setPrimary] = useState<KeySlot>(EMPTY_SLOT);
    const [fallback, setFallback] = useState<KeySlot>(EMPTY_SLOT);
    const [pageLoading, setPageLoading] = useState(true);
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [snippetCopied, setSnippetCopied] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    // ── Lock (hide) a key after the user clicks Done ─────────────────────────
    const lockKey = (type: KeyType) => {
        const set = type === "primary" ? setPrimary : setFallback;
        set(p => ({ ...p, revealedKey: null, revealed: false }));
    };

    // ── Load key status ───────────────────────────────────────────────────────
    const loadStatus = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) { setPageLoading(false); return; }
        try {
            const r = await fetch(`${API_URL}/user/api-key-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await r.json();
            if (r.ok && data.status) {
                setPrimary(p => ({ ...p, active: data.status.primary.active, createdAt: data.status.primary.createdAt }));
                setFallback(p => ({ ...p, active: data.status.fallback.active, createdAt: data.status.fallback.createdAt }));
            }
        } catch (e) { console.error(e); }
        finally { setPageLoading(false); }
    }, [API_URL]);

    useEffect(() => { loadStatus(); }, [loadStatus]);

    // ── Generate / rotate ─────────────────────────────────────────────────────
    const handleGenerate = async (type: KeyType) => {
        const cur = type === "primary" ? primary : fallback;
        const set = type === "primary" ? setPrimary : setFallback;

        if (cur.active) {
            const ok = window.confirm(
                type === "primary"
                    ? "Regenerate the Primary key?\n\nAll widgets using this key will stop working immediately."
                    : "Regenerate the Fallback key?\n\nThe current fallback key will be replaced."
            );
            if (!ok) return;
        }

        set(p => ({ ...p, loading: true }));
        const token = localStorage.getItem("token");
        try {
            const r = await fetch(`${API_URL}/user/generate-api-key`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });
            const d = await r.json();
            if (r.ok) {
                set(() => ({
                    ...EMPTY_SLOT,
                    active: true,
                    createdAt: new Date().toISOString(),
                    revealedKey: d.apiKey,
                    revealed: true, // Auto-reveal on generation
                    loading: false,
                    copied: false,
                }));
            } else {
                alert(d.message || "Failed to generate key");
                set(p => ({ ...p, loading: false }));
            }
        } catch {
            alert("Error generating key");
            set(p => ({ ...p, loading: false }));
        }
    };

    // ── Revoke fallback ───────────────────────────────────────────────────────
    const handleRevoke = async () => {
        setRevoking(true);
        const token = localStorage.getItem("token");
        try {
            const r = await fetch(`${API_URL}/user/fallback-api-key`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) { setFallback(EMPTY_SLOT); setConfirmRevoke(false); }
            else alert("Failed to revoke fallback key");
        } catch { alert("Error revoking fallback key"); }
        finally { setRevoking(false); }
    };

    // ── Copy helpers ──────────────────────────────────────────────────────────
    const copyKey = (type: KeyType) => {
        const key = (type === "primary" ? primary : fallback).revealedKey;
        if (!key) return;
        navigator.clipboard.writeText(key);
        (type === "primary" ? setPrimary : setFallback)(p => ({ ...p, copied: true }));
        setTimeout(() =>
            (type === "primary" ? setPrimary : setFallback)(p => ({ ...p, copied: false }))
            , 2000);
    };

    const copySnippet = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setSnippetCopied(id);
        setTimeout(() => setSnippetCopied(null), 2000);
    };

    // Use primary's revealed key for snippets, else placeholder
    const snippetKey = primary.revealedKey ?? (primary.active ? "••••••••••••••••••••••••••••" : "YOUR_API_KEY");

    const scriptSnippet = `<script 
  src="https://cdn.punchai.io/widget.js" 
  data-api-key="${snippetKey}"
  async
></script>`;

    const nextjsSnippet = `// app/api/chat/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();
  
  const response = await fetch("${API_URL}/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.PUNCHAI_API_KEY // Store "${snippetKey}" in .env
    },
    body: JSON.stringify({ sessionId, message })
  });

  const data = await response.json();
  return NextResponse.json(data);
}`;

    const reactHookSnippet = `// usePunchAI.ts
import { useState } from 'react';

export const usePunchAI = () => {
  const [loading, setLoading] = useState(false);

  const askAI = async (message: string, sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { // Point to your Next.js route
        method: "POST",
        body: JSON.stringify({ message, sessionId })
      });
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  return { askAI, loading };
};`;

    const curlSnippet = `curl -X POST ${API_URL}/chat \\
  -H "x-api-key: ${snippetKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId": "test-session", "message": "Hello!"}'`;

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6 text-foreground">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Integration & API Keys</h1>
                <p className="text-muted-foreground">Manage your secure access keys and integrate PunchAI into your website or app.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Primary Key Slot ────────────────────────────────────────── */}
                <KeyCard
                    title="Primary API Key"
                    description="This is the main key used for your production environment."
                    data={primary}
                    onGenerate={() => handleGenerate("primary")}
                    onCopy={() => copyKey("primary")}
                    onDone={() => lockKey("primary")}
                    badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                />

                {/* ── Fallback Key Slot ───────────────────────────────────────── */}
                <KeyCard
                    title="Fallback API Key"
                    description="Use this when rotating keys to prevent downtime."
                    data={fallback}
                    onGenerate={() => handleGenerate("fallback")}
                    onCopy={() => copyKey("fallback")}
                    onDone={() => lockKey("fallback")}
                    badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
                    onRevoke={fallback.active ? () => setConfirmRevoke(true) : undefined}
                />
            </div>

            {/* ── Integration Snippets ───────────────────────────────────────── */}
            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-primary" />
                        Quick Integration
                    </CardTitle>
                    <CardDescription>
                        Copy these snippets to get started with PunchAI. Preferred integration for React/Next.js is via a secure Proxy route.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="nextjs" className="w-full">
                        <TabsList className="grid grid-cols-4 w-full bg-muted/50 border border-border">
                            <TabsTrigger value="nextjs">Next.js (Proxy)</TabsTrigger>
                            <TabsTrigger value="react">React Hook</TabsTrigger>
                            <TabsTrigger value="widget">Widget Tag</TabsTrigger>
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                        </TabsList>

                        <TabsContent value="nextjs">
                            <SnippetBlock
                                id="nextjs"
                                title="Next.js API Route (Server-side Proxy)"
                                description="Secure way to use PunchAI without exposing your API key in the browser."
                                code={nextjsSnippet}
                                onCopy={() => copySnippet("nextjs", nextjsSnippet)}
                                isCopied={snippetCopied === "nextjs"}
                            />
                        </TabsContent>
                        <TabsContent value="react">
                            <SnippetBlock
                                id="react"
                                title="Custom UI Hook"
                                description="Use this hook to build your own chat interface."
                                code={reactHookSnippet}
                                onCopy={() => copySnippet("react", reactHookSnippet)}
                                isCopied={snippetCopied === "react"}
                            />
                        </TabsContent>
                        <TabsContent value="widget">
                            <SnippetBlock
                                id="widget"
                                title="Fastest Integration"
                                description="Just drop this tag into your HTML."
                                code={scriptSnippet}
                                onCopy={() => copySnippet("widget", scriptSnippet)}
                                isCopied={snippetCopied === "widget"}
                            />
                        </TabsContent>
                        <TabsContent value="curl">
                            <SnippetBlock
                                id="curl"
                                title="API Testing"
                                description="Test your connection from the terminal."
                                code={curlSnippet}
                                onCopy={() => copySnippet("curl", curlSnippet)}
                                isCopied={snippetCopied === "curl"}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ── Revoke Fallback Confirmation Modal ── */}
            {confirmRevoke && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="max-w-md w-full border-red-500/20 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="w-5 h-5" />
                                Revoke Fallback Key?
                            </CardTitle>
                            <CardDescription>
                                This will permanently invalidate the fallback key. Ensure all your applications are updated to the current primary key.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                            <Button variant="ghost" onClick={() => setConfirmRevoke(false)} disabled={revoking}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>
                                {revoking ? "Revoking..." : "Confirm Revoke"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}

// ── Shared Components ─────────────────────────────────────────────────────────

function KeyCard({ title, description, data, onGenerate, onCopy, onDone, badgeColor, onRevoke }: any) {
    return (
        <Card className="border-border bg-card overflow-hidden flex flex-col">
            <div className={`h-1.5 w-full ${data.active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`} />
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                {data.active ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-muted/30 border border-border rounded-lg relative overflow-hidden group">
                            <div className="flex justify-between items-center gap-2">
                                <code className="text-sm font-mono break-all text-foreground/90">
                                    {data.revealedKey ? data.revealedKey : mask("pak_" + "•".repeat(64))}
                                </code>
                                {data.revealedKey && (
                                    <Button size="icon" variant="ghost" onClick={onCopy} className="shrink-0 h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                        {data.copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 opacity-70" />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant="outline" className={`rounded-full px-3 ${badgeColor}`}>
                                <ShieldCheck className="w-3 h-3 mr-1.5" />
                                Active
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Created {new Date(data.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {data.revealedKey ? (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-500 flex items-start gap-2">
                                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        This key is only visible now. Copy and store it securely! Once you close this or click <strong>Done</strong>, it will be masked forever.
                                    </span>
                                </p>
                                <Button size="sm" className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={onDone}>
                                    I&apos;ve saved it, hide now
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={onGenerate} disabled={data.loading} className="flex-1">
                                    <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${data.loading ? 'animate-spin' : ''}`} />
                                    Rotate Key
                                </Button>
                                {onRevoke && (
                                    <Button variant="outline" size="sm" onClick={onRevoke} className="text-red-500 hover:text-red-400 hover:bg-red-500/5">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed border-border rounded-xl">
                        <div className="p-3 rounded-full bg-muted border border-border mb-3">
                            <Key className="w-6 h-6 opacity-20" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">No key generated for this slot yet.</p>
                        <Button size="sm" onClick={onGenerate} disabled={data.loading}>
                            {data.loading ? "Generating..." : "Generate Primary Key"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SnippetBlock({ id, title, description, code, onCopy, isCopied }: any) {
    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="relative group">
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto font-mono text-sm text-zinc-300 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
                    <code>{code}</code>
                </pre>
                <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700"
                    onClick={onCopy}
                >
                    {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {isCopied ? "Copied" : "Copy Code"}
                </Button>
            </div>
        </div>
    );
}

function CardFooter({ children, className }: any) {
    return <div className={`p-6 ${className}`}>{children}</div>;
}

