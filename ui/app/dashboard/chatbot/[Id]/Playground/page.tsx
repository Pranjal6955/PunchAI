"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getBot,
  getProfile,
  addMessage,
  createChat,
  getChat,
  Bot,
  User,
  Message,
} from "@/lib/api-session";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Send,
  ArrowLeft,
  Bot as BotIcon,
  User as UserIcon,
  RotateCcw,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  Settings2,
  Database,
  Sparkles,
  Info,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/lib/api-session";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtendedMessage extends Message {
  /** Marks this as an optimistic temp message that failed to send */
  failed?: boolean;
  /** Original content so we can retry */
  pendingContent?: string;
}

// ─── useCopyToClipboard hook ──────────────────────────────────────────────────

function useCopyToClipboard(timeoutMs = 1500) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copy = React.useCallback(
    (id: string, text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), timeoutMs);
        })
        .catch(() => {
          /* clipboard blocked — silently fail */
        });
    },
    [timeoutMs]
  );

  return { copiedId, copy };
}

// ─── Markdown renderer (memoised to avoid re-render on every keystroke) ───────

const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] =
{
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="bg-black/10 rounded px-1 py-0.5 font-mono text-xs">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-black/10 mb-2 overflow-x-auto rounded p-3 font-mono text-xs">
      {children}
    </pre>
  ),
  h1: ({ children }) => (
    <h1 className="mb-1 text-base font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 text-sm font-bold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 text-sm font-semibold">{children}</h3>
  ),
};

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="border-border bg-background flex size-8 shrink-0 items-center justify-center rounded-none border">
        <BotIcon className="size-4" />
      </div>
      <div className="border-border bg-background flex items-center gap-1.5 border px-5 py-4 shadow-sm">
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
        <span className="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Source citation chip ─────────────────────────────────────────────────────

function CitationChip({ count, onClick }: { count: number, onClick?: () => void }) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-border/50 text-muted-foreground/60 inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest transition-colors",
        onClick && "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
      )}
    >
      <FileText className="size-2.5" />
      {count} source{count !== 1 ? "s" : ""}
    </button>
  );
}

function ContextPanel({
  chunks,
  onClose,
  modelName
}: {
  chunks: string[] | null,
  onClose: () => void,
  modelName?: string
}) {
  return (
    <div className="border-border/40 bg-background flex h-full w-[350px] shrink-0 flex-col border-l">
      <div className="border-border/40 flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Database className="text-primary size-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Retrieved Context</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {modelName && (
          <div className="bg-primary/5 border-primary/20 border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-primary size-3" />
              <span className="text-[9px] font-bold tracking-widest uppercase">AI Engine</span>
            </div>
            <p className="text-[11px] font-medium text-primary/80">{modelName}</p>
          </div>
        )}

        {!chunks || chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <Info className="size-8 mb-2" />
            <p className="text-[10px] font-bold tracking-widest uppercase">No context retrieved</p>
          </div>
        ) : (
          chunks.map((chunk, i) => (
            <div key={i} className="border-border/60 bg-muted/5 border p-3">
              <div className="text-muted-foreground/50 mb-2 text-[9px] font-bold tracking-widest uppercase">
                Chunk #{i + 1}
              </div>
              <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">{chunk}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const { Id } = useParams();
  const router = useRouter();

  const [bot, setBot] = React.useState<Bot | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [messages, setMessages] = React.useState<ExtendedMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [chatId, setChatId] = React.useState<string | null>(null);
  const [hasDataSources, setHasDataSources] = React.useState<boolean | null>(null);

  // Pro Playground states (Phase 3)
  const [selectedModel, setSelectedModel] = React.useState<string>("default");
  const [activeContext, setActiveContext] = React.useState<string[] | null>(null);
  const [showContextPanel, setShowContextPanel] = React.useState(false);

  // Improvement C: copy-to-clipboard
  const { copiedId, copy } = useCopyToClipboard();

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ── Bug 8 fix: session key per bot ──────────────────────────────────────────
  const sessionKey = `playground_chat_${Id as string}`;

  // ── Initialise ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchData = async () => {
      if (!Id) return;
      try {
        const [botData, profile] = await Promise.all([
          getBot(Id as string),
          getProfile(),
        ]);

        if (!botData || !profile) {
          toast.error("Data could not be loaded");
          router.push("/dashboard/chatbot");
          return;
        }

        setBot(botData);
        setUser(profile);

        // Bug 6 fix: warn when bot has no data sources
        setHasDataSources((botData.dataSourceCount ?? 0) > 0);

        // Bug 8 fix: reuse existing session stored in sessionStorage
        const storedChatId = sessionStorage.getItem(sessionKey);
        if (storedChatId) {
          const existing = await getChat(storedChatId).catch(() => null);
          if (existing) {
            setChatId(existing.id);
            // Sort messages chronologically
            const sorted = [...(existing.messages ?? [])].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setMessages(sorted as ExtendedMessage[]);
            return;
          }
          // Stored chat gone — fall through to create new one
          sessionStorage.removeItem(sessionKey);
        }

        const chat = await createChat({ userId: profile.id, botId: botData.id });
        if (chat) {
          setChatId(chat.id);
          sessionStorage.setItem(sessionKey, chat.id);
          setMessages((chat.messages ?? []) as ExtendedMessage[]);
        }
      } catch (err) {
        console.error("Failed to initialise playground", err);
        toast.error("Failed to initialise chat session");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [Id, router, sessionKey]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sending]);

  // ── Bug 9 fix: auto-resize textarea ─────────────────────────────────────────
  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  // ── Core send logic ──────────────────────────────────────────────────────────
  const sendMessage = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim();

      // Bug 4 + 10 fix: client-side guard (backend also validates)
      if (!trimmed || !chatId || sending) return;
      if (trimmed.length > MAX_CHARS) {
        toast.error(`Message too long (max ${MAX_CHARS} characters)`);
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const tempMsg: ExtendedMessage = {
        id: tempId,
        role: "USER",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      // Optimistic add
      setMessages((prev) => [...prev, tempMsg]);
      setSending(true);

      try {
        const reply = await addMessage(
          chatId,
          trimmed,
          selectedModel === "default" ? undefined : selectedModel
        );
        if (reply) {
          // Bug 1 fix: keep user temp (content correct), append assistant reply
          setMessages((prev) => [...prev, reply as ExtendedMessage]);
        }
      } catch {
        // Bug 2 fix: mark message as failed with retry affordance
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, failed: true, pendingContent: trimmed }
              : m
          )
        );
        toast.error("Message failed to send. Tap Retry to try again.");
      } finally {
        setSending(false);
      }
    },
    [chatId, sending]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(content);
  };

  // Bug 3 fix: directly call sendMessage — no DOM hack
  const handleQuickQuestion = (q: string) => {
    void sendMessage(q);
  };

  // Bug 2 fix: retry a failed message
  const handleRetry = (msg: ExtendedMessage) => {
    if (!msg.pendingContent) return;
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    void sendMessage(msg.pendingContent);
  };

  // Bug 9 fix: Shift+Enter = newline, Enter = send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as unknown as React.FormEvent);
    }
  };

  // Clear conversation + create fresh session
  const handleClear = async () => {
    if (!bot || !user) return;
    sessionStorage.removeItem(sessionKey);
    setMessages([]);
    try {
      const chat = await createChat({ userId: user.id, botId: bot.id });
      if (chat) {
        setChatId(chat.id);
        sessionStorage.setItem(sessionKey, chat.id);
      }
    } catch {
      toast.error("Failed to create new session");
    }
  };

  const handleFeedback = async (msgId: string, feedback: number) => {
    if (!chatId) return;
    try {
      const success = await submitFeedback(chatId, msgId, feedback);
      if (success) {
        setMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, feedback } : m)
        );
        toast.success(feedback === 1 ? "Positive feedback recorded" : "Negative feedback recorded");
      }
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const charsLeft = MAX_CHARS - input.length;
  const isOverLimit = charsLeft < 0;
  const showCounter = input.length > MAX_CHARS * 0.7;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-background flex h-full flex-col space-y-4 p-8">
        <Skeleton className="h-10 w-64 rounded-none" />
        <Skeleton className="w-full flex-1 rounded-none" />
      </div>
    );
  }

  if (!bot || !user) return null;

  return (
    <div className="bg-background flex h-[calc(100vh-64px)] flex-col overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-border/40 flex h-16 items-center justify-between gap-4 border-b px-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/chatbot/${Id as string}`}>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted h-8 w-8 rounded-none"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Selector (Phase 3) */}
        <div className="bg-muted/10 border-border/40 hidden items-center gap-2 border px-3 py-1.5 md:flex">
          <Settings2 className="text-muted-foreground size-3.5" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-[10px] font-bold tracking-widest uppercase outline-none"
          >
            <option value="default py-1">Smart (Default)</option>
            <option value="openai/gpt-4o">GPT-4o (Premium)</option>
            <option value="google/gemini-2.0-flash-001">Gemini 2.0 (Fast)</option>
            <option value="deepseek/deepseek-chat">DeepSeek V3</option>
            <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 (Groq)</option>
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 rounded-none text-[10px] uppercase tracking-widest",
            showContextPanel ? "bg-primary/10 text-primary" : "text-muted-foreground"
          )}
          onClick={() => setShowContextPanel(!showContextPanel)}
        >
          <Database className="mr-2 size-3.5" />
          Context
        </Button>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 rounded-none text-[10px] uppercase tracking-widest border-l border-border/40 pl-4"
            onClick={() => void handleClear()}
          >
            Clear
          </Button>
        )}
      </div>
    </div>

      {/* ── Bug 6 fix: no-data-sources warning ─────────────────────────────── */ }
  {
    hasDataSources === false && (
      <div className="border-border/40 bg-amber-500/5 flex items-center gap-3 border-b px-6 py-2.5">
        <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
        <p className="text-xs text-amber-400/80">
          No data sources connected — responses draw from general knowledge
          only.{" "}
          <Link
            href={`/dashboard/chatbot/${Id as string}`}
            className="underline underline-offset-2"
          >
            Add a data source
          </Link>
        </p>
      </div>
    )
  }
  {/* ── Main Chat Area ── */ }
  <div className="flex flex-1 overflow-hidden">
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Chat history ────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="bg-muted/5 flex-1 space-y-6 overflow-y-auto p-6 md:p-10"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Empty state */}
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BotIcon className="text-primary/40 mb-6 size-16" />
              <h2 className="mb-2 text-xl font-bold tracking-tight uppercase">
                Start a New Conversation
              </h2>
              <p className="text-muted-foreground mb-12 max-w-sm text-sm font-medium">
                Ask {bot.name} anything about your connected data sources.
              </p>

              {/* Bug 3 fix: quick questions call sendMessage directly */}
              <div className="grid w-full max-w-md gap-3">
                {[
                  "Tell me about the documents you've processed.",
                  "What are the key takeaways from your data?",
                  "Help me understand how you can assist me.",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    disabled={sending}
                    className="border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 group flex items-center justify-between border px-6 py-4 text-left text-[11px] font-bold tracking-widest uppercase transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {q}
                    <Send className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            messages.map((msg) => {
              // Improvement A: extract source_chunks count from assistant metadata
              const metadata = (msg.metadata as Record<string, unknown>) ?? {};
              const sourceCount = (metadata.source_chunks as number) ?? 0;
              const sourceChunks = (metadata.chunks as string[]) ?? [];
              const modelName = (metadata.model as string) ?? "";
              const isCopied = copiedId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group flex gap-4",
                    msg.role === "USER" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-none border",
                      msg.role === "USER"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                      msg.failed && "border-red-400/50 bg-red-400/10"
                    )}
                  >
                    {msg.role === "USER" ? (
                      <UserIcon className="size-4" />
                    ) : (
                      <BotIcon className="size-4" />
                    )}
                  </div>

                  {/* Bubble + meta row */}
                  <div
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1.5",
                      msg.role === "USER" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "border px-5 py-3 text-sm leading-relaxed",
                        msg.role === "USER"
                          ? "border-primary/20 bg-primary/5 text-foreground"
                          : "border-border bg-background shadow-sm",
                        msg.failed && "border-red-400/30 bg-red-400/5"
                      )}
                    >
                      {msg.role === "USER" ? (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* Improvement A + C: citation chip + copy button row (assistant only) */}
                    {msg.role === "ASSISTANT" && !msg.failed && (
                      <div className="flex items-center gap-2">
                        <CitationChip
                          count={sourceCount}
                          onClick={() => {
                            setActiveContext(sourceChunks);
                            setShowContextPanel(true);
                          }}
                        />

                        {/* Improvement C: copy button */}
                        <button
                          onClick={() => copy(msg.id, msg.content)}
                          title="Copy response"
                          className={cn(
                            "text-muted-foreground/40 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-all",
                            "opacity-0 group-hover:opacity-100",
                            isCopied
                              ? "text-emerald-400"
                              : "hover:text-muted-foreground"
                          )}
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              Copy
                            </>
                          )}
                        </button>

                        {/* Model indicator */}
                        {modelName && (
                          <span className="text-[9px] font-bold tracking-widest uppercase opacity-20 pointer-events-none ml-2">
                            {modelName.split('/').pop()}
                          </span>
                        )}

                        {/* Phase 3: HITL Feedback */}
                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleFeedback(msg.id, 1)}
                            className={cn(
                              "p-1 hover:bg-emerald-500/10 transition-colors",
                              msg.feedback === 1 ? "text-emerald-500" : "text-muted-foreground/30"
                            )}
                          >
                            <ThumbsUp className="size-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, -1)}
                            className={cn(
                              "p-1 hover:bg-red-500/10 transition-colors",
                              msg.feedback === -1 ? "text-red-500" : "text-muted-foreground/30"
                            )}
                          >
                            <ThumbsDown className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bug 2 fix: retry affordance on failed messages */}
                    {msg.failed && (
                      <button
                        onClick={() => handleRetry(msg)}
                        className="flex items-center gap-1 self-end text-[10px] font-semibold uppercase tracking-widest text-red-400/70 transition-colors hover:text-red-400"
                      >
                        <RotateCcw className="size-3" />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {sending && <TypingIndicator />}
        </div>
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <div className="bg-background border-border/40 border-t p-4 md:p-6">
        <form
          onSubmit={(e) => void handleSend(e)}
          className="mx-auto flex max-w-3xl flex-col gap-2"
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              placeholder="Ask anything… (Shift+Enter for newline)"
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setInput(e.target.value);
                  adjustHeight();
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
              className={cn(
                "border-border/60 focus-visible:border-primary bg-muted/5 min-h-[48px] w-full flex-1 resize-none rounded-none border px-5 py-3 text-sm leading-relaxed focus:outline-none",
                isOverLimit && "border-red-400/60"
              )}
              style={{ maxHeight: "160px" }}
            />
            <Button
              id="send-button"
              type="submit"
              disabled={sending || !input.trim() || isOverLimit}
              className="shadow-primary/20 h-12 shrink-0 self-end rounded-none px-6 shadow-lg"
            >
              <Send className="mr-2 size-4" />
              Send
            </Button>
          </div>

          {showCounter && (
            <span
              className={cn(
                "self-end text-[10px] tabular-nums transition-colors",
                charsLeft < 100 ? "text-red-400" : "text-muted-foreground/50"
              )}
            >
              {charsLeft} chars remaining
            </span>
          )}
        </form>
      </div>
    </div>

    {/* Side Panel (Context) */}
    {showContextPanel && (
      <ContextPanel
        chunks={activeContext}
        onClose={() => setShowContextPanel(false)}
        modelName={messages.filter(m => m.role === "ASSISTANT").pop()?.metadata?.model as string}
      />
    )}
  </div>
    </div >
  );
}
