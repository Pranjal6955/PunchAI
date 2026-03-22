"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, RefreshCcw, Code, Check, ExternalLink, Key, ShieldCheck, ShieldOff, AlertTriangle, Eye, EyeOff, Trash2, Info } from "lucide-react";
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
    /* 
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
            if (r.ok) {
                const { status } = await r.json();
                setPrimary(p => ({ ...p, active: status.primary.active, createdAt: status.primary.createdAt }));
                setFallback(p => ({ ...p, active: status.fallback.active, createdAt: status.fallback.createdAt }));
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
                    revealed: false,
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
    const snippetKey = primary.revealedKey ?? (primary.active ? "YOUR_PRIMARY_KEY" : "YOUR_API_KEY");

    const scriptSnippet = `<script 
  src="https://cdn.punchai.io/widget.js" 
  data-api-key="${snippetKey}"
  async
></script>`;

    const nodeSnippet = `const sendMessage = async (message) => {
  const response = await fetch("${API_URL}/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "${snippetKey}"
    },
    body: JSON.stringify({
      sessionId: "user-session-id",
      message: message
    })
  });
  const { answer, sources } = await response.json();
  return answer;
};`;

    const curlSnippet = `curl -X POST ${API_URL}/chat \\
  -H "x-api-key: ${snippetKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId": "test-session", "message": "Hello!"}'`;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }
    */

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4">
            <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-amber-500/20 rounded-full" />
                <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-amber-500/20 backdrop-blur-sm">
                    <RefreshCcw className="w-16 h-16 text-amber-500 animate-spin [animation-duration:3s]" />
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    Integration Portal
                </h1>
                <p className="text-zinc-400 max-w-lg mx-auto text-lg">
                    We&apos;re currently forging the connection hub. Soon you&apos;ll be able to generate secure API keys and integrate PunchAI seamlessly into your workflow.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <Badge variant="outline" className="px-6 py-1.5 text-sm bg-amber-500/5 text-amber-500 border-amber-500/20 rounded-full whitespace-nowrap">
                    <span className="mr-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Currently Under Development
                </Badge>

                <div className="flex gap-4 pt-4">
                    <Button variant="ghost" className="text-zinc-500 hover:text-white" disabled>
                        Documentation
                    </Button>
                    <Button variant="ghost" className="text-zinc-500 hover:text-white" disabled>
                        API Reference
                    </Button>
                </div>
            </div>

            {/* Existing Implementation Commented Out Below */}
            {/*
            <div className="max-w-4xl mx-auto space-y-8 py-6">
                ... (rest of the underlying logic is preserved)
            </div>
            */}
        </div>
    );
}

// Keep helper components but can also comment them if needed
/* 
function KeyCard(...) { ... }
function SnippetBlock(...) { ... }
*/
