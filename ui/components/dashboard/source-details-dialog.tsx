"use client"

import * as React from "react"
import { DataSource, DocumentChunk, FAQ } from "@/lib/api-session"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    FileText,
    Globe,
    MessageSquareText,
    Pencil,
    Check,
    X,
    Trash2,
    Loader2,
    Sparkles,
    Copy,
    Info,
    AlertCircle,
    CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SourceDetailsDialogProps {
    source: DataSource | null
    onClose: () => void
    content: { chunks: DocumentChunk[]; faqs: FAQ[] }
    contentLoading: boolean
    itemUpdating: string | null
    onUpdateChunk: (chunkId: string, newContent: string) => Promise<void>
    onDeleteChunk: (chunkId: string) => Promise<void>
    onUpdateFaq: (faqId: string, question: string, answer: string) => Promise<void>
    onDeleteFaq: (faqId: string) => Promise<void>
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sourceIcon(type: DataSource["type"]) {
    if (type === "FILE") return <FileText className="h-5 w-5" />
    if (type === "URL") return <Globe className="h-5 w-5" />
    return <MessageSquareText className="h-5 w-5" />
}

function sourceColors(type: DataSource["type"]) {
    if (type === "FILE") return "bg-blue-500/10 border-blue-500/20 text-blue-400"
    if (type === "URL") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    return "bg-orange-500/10 border-orange-500/20 text-orange-400"
}

function statusBadge(status: DataSource["status"]) {
    if (status === "COMPLETED")
        return <Badge className="rounded-none bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Indexed</Badge>
    if (status === "FAILED")
        return <Badge variant="destructive" className="rounded-none text-[10px] font-bold uppercase tracking-wider gap-1"><AlertCircle className="h-2.5 w-2.5" />Failed</Badge>
    return <Badge variant="secondary" className="rounded-none text-[10px] font-bold uppercase tracking-wider gap-1 animate-pulse"><Loader2 className="h-2.5 w-2.5 animate-spin" />Processing</Badge>
}

// ─────────────────────────────────────────────
// AI Improve helper (client-side stub)
// Replaces selected text with a "cleaned" version.
// In production, wire to a real AI endpoint.
// ─────────────────────────────────────────────
async function aiImprove(text: string, prompt?: string): Promise<string> {
    const { authorizedFetch, parseJsonSafely } = await import("@/lib/api-session")
    const res = await authorizedFetch("/api/ai/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, prompt: prompt ?? "Improve clarity and fix any grammar issues." }),
    })
    if (!res.ok) {
        const err = await parseJsonSafely<{ detail?: string }>(res)
        throw new Error(err?.detail ?? "AI request failed")
    }
    const data = await parseJsonSafely<{ result: string }>(res)
    return data?.result ?? text
}

// ─────────────────────────────────────────────
// Chunk row (document / URL chunks)
// ─────────────────────────────────────────────
function ChunkRow({
    chunk,
    index,
    isUpdating,
    onUpdate,
    onDelete,
}: {
    chunk: DocumentChunk
    index: number
    isUpdating: boolean
    onUpdate: (chunkId: string, content: string) => Promise<void>
    onDelete: (chunkId: string) => Promise<void>
}) {
    const [editing, setEditing] = React.useState(false)
    const [draft, setDraft] = React.useState(chunk.content)
    const [aiLoading, setAiLoading] = React.useState(false)
    const [showAiPrompt, setShowAiPrompt] = React.useState(false)
    const [aiPrompt, setAiPrompt] = React.useState("")

    const handleSave = async () => {
        await onUpdate(chunk.id, draft)
        setEditing(false)
    }

    const handleDiscard = () => {
        setDraft(chunk.content)
        setEditing(false)
        setShowAiPrompt(false)
        setAiPrompt("")
    }

    const handleAiApply = async () => {
        if (!aiPrompt.trim()) return
        setAiLoading(true)
        try {
            const improved = await aiImprove(draft, aiPrompt)
            setDraft(improved)
            setShowAiPrompt(false)
            setAiPrompt("")
            toast.success("AI applied your instructions")
        } catch {
            toast.error("AI improvement failed")
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <div
            className={cn(
                "group border border-white/5 bg-white/[0.02] transition-all",
                editing && "border-primary/30 bg-primary/[0.03]"
            )}
        >
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Extracted Data
                </span>
                <div className="flex items-center gap-1">
                    {!editing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                onClick={() => { void navigator.clipboard.writeText(chunk.content); toast.success("Copied!") }}
                                title="Copy content"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                onClick={() => setEditing(true)}
                                disabled={isUpdating}
                                title="Edit content"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => onDelete(chunk.id)}
                                disabled={isUpdating}
                                title="Delete segment"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-none text-[10px] font-bold uppercase tracking-wider gap-1.5 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                                onClick={() => setShowAiPrompt((v) => !v)}
                                disabled={aiLoading || isUpdating}
                            >
                                <Sparkles className="h-3 w-3" />
                                AI Fix
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none hover:bg-emerald-500/10 text-emerald-400"
                                onClick={handleSave}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none hover:bg-destructive/10 text-destructive"
                                onClick={handleDiscard}
                                disabled={isUpdating}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* AI Prompt panel */}
            {editing && showAiPrompt && (
                <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-500/[0.04] space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> AI Instruction
                    </label>
                    <div className="flex gap-2">
                        <Input
                            placeholder='e.g. "Remove all phone numbers" or "Fix grammar"'
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 rounded-none bg-background/50 border-violet-500/30 text-sm focus-visible:ring-1 focus-visible:ring-violet-500/40 h-9"
                            onKeyDown={(e) => { if (e.key === "Enter") void handleAiApply() }}
                            autoFocus
                        />
                        <Button
                            size="sm"
                            className="rounded-none h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider gap-1.5"
                            onClick={handleAiApply}
                            disabled={aiLoading || !aiPrompt.trim()}
                        >
                            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            Apply
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-none h-9 px-3 text-muted-foreground hover:bg-white/10"
                            onClick={() => { setShowAiPrompt(false); setAiPrompt("") }}
                            disabled={aiLoading}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Content area */}
            <div className="px-4 py-3">
                {editing ? (
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="min-h-[150px] max-h-[400px] overflow-y-auto resize-y rounded-none bg-background/50 border-white/10 text-sm focus-visible:ring-1 focus-visible:ring-primary/40 leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {chunk.content}
                    </p>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// FAQ row
// ─────────────────────────────────────────────
function FaqRow({
    faq,
    index,
    isUpdating,
    onUpdate,
    onDelete,
}: {
    faq: FAQ
    index: number
    isUpdating: boolean
    onUpdate: (id: string, q: string, a: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}) {
    const [editing, setEditing] = React.useState(false)
    const [draftQ, setDraftQ] = React.useState(faq.question)
    const [draftA, setDraftA] = React.useState(faq.answer)
    const [aiLoading, setAiLoading] = React.useState(false)
    const [showAiPrompt, setShowAiPrompt] = React.useState(false)
    const [aiPrompt, setAiPrompt] = React.useState("")

    const handleSave = async () => {
        await onUpdate(faq.id, draftQ, draftA)
        setEditing(false)
    }

    const handleDiscard = () => {
        setDraftQ(faq.question)
        setDraftA(faq.answer)
        setEditing(false)
        setShowAiPrompt(false)
        setAiPrompt("")
    }

    const handleAiApply = async () => {
        if (!aiPrompt.trim()) return
        setAiLoading(true)
        try {
            const [improvedQ, improvedA] = await Promise.all([
                aiImprove(draftQ, aiPrompt),
                aiImprove(draftA, aiPrompt),
            ])
            setDraftQ(improvedQ)
            setDraftA(improvedA)
            setShowAiPrompt(false)
            setAiPrompt("")
            toast.success("AI applied your instructions")
        } catch {
            toast.error("AI improvement failed")
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <div
            className={cn(
                "group border border-white/5 bg-white/[0.02] transition-all",
                editing && "border-primary/30 bg-primary/[0.03]"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Q&amp;A {index + 1}
                </span>
                <div className="flex items-center gap-1">
                    {!editing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                onClick={() => {
                                    const text = `Q: ${faq.question}\nA: ${faq.answer}`;
                                    void navigator.clipboard.writeText(text);
                                    toast.success("Copied to clipboard!");
                                }}
                                title="Copy FAQ"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                                onClick={() => setEditing(true)}
                                disabled={isUpdating}
                                title="Edit FAQ"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => onDelete(faq.id)}
                                disabled={isUpdating}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-none text-[10px] font-bold uppercase tracking-wider gap-1.5 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                                onClick={() => setShowAiPrompt((v) => !v)}
                                disabled={aiLoading || isUpdating}
                            >
                                <Sparkles className="h-3 w-3" />
                                AI Fix
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none hover:bg-emerald-500/10 text-emerald-400"
                                onClick={handleSave}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-none hover:bg-destructive/10 text-destructive"
                                onClick={handleDiscard}
                                disabled={isUpdating}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* AI Prompt panel */}
            {editing && showAiPrompt && (
                <div className="px-4 py-3 border-b border-violet-500/20 bg-violet-500/[0.04] space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> AI Instruction
                    </label>
                    <div className="flex gap-2">
                        <Input
                            placeholder='e.g. "Make the answer shorter" or "Fix grammar"'
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 rounded-none bg-background/50 border-violet-500/30 text-sm focus-visible:ring-1 focus-visible:ring-violet-500/40 h-9"
                            onKeyDown={(e) => { if (e.key === "Enter") void handleAiApply() }}
                            autoFocus
                        />
                        <Button
                            size="sm"
                            className="rounded-none h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider gap-1.5"
                            onClick={handleAiApply}
                            disabled={aiLoading || !aiPrompt.trim()}
                        >
                            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            Apply
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-none h-9 px-3 text-muted-foreground hover:bg-white/10"
                            onClick={() => { setShowAiPrompt(false); setAiPrompt("") }}
                            disabled={aiLoading}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="px-4 py-3 space-y-3">
                {editing ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Question</label>
                            <Input
                                value={draftQ}
                                onChange={(e) => setDraftQ(e.target.value)}
                                className="rounded-none bg-background/50 border-white/10 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Answer</label>
                            <Textarea
                                value={draftA}
                                onChange={(e) => setDraftA(e.target.value)}
                                className="min-h-[100px] max-h-[300px] overflow-y-auto resize-y rounded-none bg-background/50 border-white/10 text-sm focus-visible:ring-1 focus-visible:ring-primary/40 leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-semibold">{faq.question}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{faq.answer}</p>
                    </>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Main dialog
// ─────────────────────────────────────────────
export function SourceDetailsDialog({
    source,
    onClose,
    content,
    contentLoading,
    itemUpdating,
    onUpdateChunk,
    onDeleteChunk,
    onUpdateFaq,
    onDeleteFaq,
}: SourceDetailsDialogProps) {
    const open = !!source
    const isChunkSource = source?.type === "FILE" || source?.type === "URL"
    const items = isChunkSource ? content.chunks : content.faqs
    const itemCount = items.length

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <DialogContent className="!max-w-4xl w-full rounded-none border-white/10 bg-background/95 backdrop-blur-xl p-0 overflow-hidden flex flex-col max-h-[90vh]">

                {/* ── Top bar ── */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
                    <div className="flex items-start gap-4">
                        {source && (
                            <div className={cn(
                                "h-12 w-12 rounded-none flex items-center justify-center border shrink-0",
                                sourceColors(source.type)
                            )}>
                                {sourceIcon(source.type)}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-xl font-bold truncate">
                                    {source?.name ?? "Source Details"}
                                </DialogTitle>
                                {source && statusBadge(source.status)}
                                {source?.type === "URL" && (
                                    <a
                                        href={source.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary-foreground/70 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-wider border border-primary/20"
                                    >
                                        Visit Source <Globe className="h-2.5 w-2.5" />
                                    </a>
                                )}
                            </div>
                            <DialogDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="h-3 w-3 shrink-0" />
                                {isChunkSource
                                    ? `${itemCount} segment${itemCount !== 1 ? "s" : ""} extracted from this source`
                                    : `${itemCount} FAQ entr${itemCount !== 1 ? "ies" : "y"} in this source`}
                            </DialogDescription>
                        </div>
                    </div>


                </DialogHeader>

                {/* ── Scrollable content ── */}
                <ScrollArea className="flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none">
                    <div className="p-6 space-y-3">
                        {contentLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-28 w-full rounded-none bg-white/5" />
                                ))}
                            </>
                        ) : itemCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                                <div className="h-16 w-16 rounded-none border border-white/10 bg-white/5 flex items-center justify-center">
                                    {source && sourceIcon(source.type)}
                                </div>
                                <div>
                                    <p className="font-semibold">No content found</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This source may still be processing, or no data was extracted.
                                    </p>
                                </div>
                            </div>
                        ) : isChunkSource ? (
                            content.chunks.map((chunk, i) => (
                                <ChunkRow
                                    key={chunk.id}
                                    chunk={chunk}
                                    index={i}
                                    isUpdating={itemUpdating === chunk.id}
                                    onUpdate={onUpdateChunk}
                                    onDelete={onDeleteChunk}
                                />
                            ))
                        ) : (
                            content.faqs.map((faq, i) => (
                                <FaqRow
                                    key={faq.id}
                                    faq={faq}
                                    index={i}
                                    isUpdating={itemUpdating === faq.id}
                                    onUpdate={onUpdateFaq}
                                    onDelete={onDeleteFaq}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between shrink-0">
                    <p className="text-[11px] text-muted-foreground">
                        Changes are saved immediately to the knowledge base.
                    </p>
                    <Button
                        variant="outline"
                        className="rounded-none border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
