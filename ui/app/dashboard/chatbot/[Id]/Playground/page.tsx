"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getBot,
  getProfile,
  addMessage,
  createChat,
  getChat,
  getSuggestedQuestions,
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
  MessageSquare,
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
}: {
  chunks: any[] | null,
  onClose: () => void,
}) {
  return (
    <div className="border-border/40 bg-background flex h-full w-[350px] shrink-0 animate-in slide-in-from-right duration-300 flex-col border-l">
      <div className="border-border/40 flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Database className="text-primary size-4" />
          <span className="text-[11px] font-bold tracking-widest uppercase">Knowledge Sync</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-border/40">
        {!chunks || chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <Info className="size-8 mb-3" />
            <p className="text-[10px] font-bold tracking-widest uppercase">Query had no citations</p>
          </div>
        ) : (
          chunks.map((chunk, i) => {
            const content = typeof chunk === 'string' ? chunk : (chunk.content || "");
            const score = typeof chunk === 'object' ? chunk.score : null;

            return (
              <div key={i} className="py-6 first:pt-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60">
                    Evidence Block {i + 1}
                  </span>
                  {score !== null && (
                    <span className="text-[8px] font-mono text-emerald-500/80">
                      Match: {(1 - score).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-xs leading-relaxed text-muted-foreground/90 font-medium italic">
                  "{content}"
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-6 bg-muted/5 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          These snippets represent the raw information retrieved from your vector store to generate this specific response.
        </p>
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
  const [suggestedQuestions, setSuggestedQuestions] = React.useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);

  // Pro Playground states (Phase 3)
  const [activeContext, setActiveContext] = React.useState<string[] | null>(null);
  const [showContextPanel, setShowContextPanel] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

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
        const hasDS = (botData.dataSourceCount ?? 0) > 0;
        setHasDataSources(hasDS);

        if (hasDS) {
          setQuestionsLoading(true);
          getSuggestedQuestions(Id as string)
            .then((qs) => {
              setSuggestedQuestions(qs);
            })
            .catch(() => {
              setSuggestedQuestions([]);
              toast.error("Failed to load suggested questions");
            })
            .finally(() => {
              setQuestionsLoading(false);
            });
        }

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
        chatId,
        createdAt: new Date().toISOString(),
      };

      // Optimistic add
      setMessages((prev) => [...prev, tempMsg]);
      setSending(true);

      try {
        const reply = await addMessage(
          chatId,
          trimmed
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

    // Optimistic Update
    const previousMessages = [...messages];
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
    );

    try {
      const success = await submitFeedback(chatId, msgId, feedback);
      if (success) {
        toast.success(feedback === 1 ? "Positive feedback recorded" : "Negative feedback recorded");
      } else {
        throw new Error("Failed");
      }
    } catch {
      setMessages(previousMessages); // Revert
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
    <div className="bg-background flex h-[calc(100vh-64px)] flex-col overflow-hidden font-sans relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 via-background to-background">
      {/* Absolute Background Layer (Fixed) */}
      <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* ── Bug 6 fix: no-data-sources warning ─────────────────────────────── */}
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
      {/* ── Main Chat Area ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          {/* Immersive Floating Controls (Stay fixed above scroll) */}
          <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <Link href={`/dashboard/chatbot/${Id as string}`}>
                <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm rounded-none border-border/40 h-8 text-[10px] uppercase tracking-widest">
                  <ArrowLeft className="mr-2 size-3" />
                  Back to Agent
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "bg-background/80 backdrop-blur-sm h-8 rounded-none text-[10px] uppercase tracking-widest border-border/40",
                  showContextPanel ? "border-primary text-primary" : "text-muted-foreground"
                )}
                onClick={() => setShowContextPanel(!showContextPanel)}
              >
                <Database className="mr-2 size-3" />
                Knowledge
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground h-8 rounded-none text-[10px] uppercase tracking-widest border-border/40"
                  onClick={() => void handleClear()}
                >
                  Clear Session
                </Button>
              )}
            </div>
          </div>

          {/* ── Chat history ────────────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 space-y-6 overflow-y-auto p-6 md:p-10 pt-24 pb-28"
          >


            <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6">
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
                    {questionsLoading ? (
                      [1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-none" />)
                    ) : (
                      (suggestedQuestions.length > 0 ? suggestedQuestions : [
                        "Tell me about the documents you've processed.",
                        "What are the key takeaways from your data?",
                        "Help me understand how you can assist me.",
                      ]).map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQuickQuestion(q)}
                          disabled={sending}
                          className="border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 group flex items-center justify-between border px-6 py-4 text-left text-[11px] font-bold tracking-widest uppercase transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="truncate pr-4">{q}</span>
                          <Send className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Messages */
                messages.map((msg) => {
                  // Improvement A: extract source_chunks count from assistant metadata
                  const metadata = (msg.metadata as Record<string, unknown>) ?? {};
                  const sourceCount = (metadata.source_chunks as number) ?? 0;
                  const sourceChunks = (metadata.chunks as string[]) ?? [];
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


                            {/* Phase 3: HITL Feedback */}
                            <div className="ml-auto flex items-center gap-1 transition-opacity">
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

          {/* ── Floating Input bar ───────────────────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pb-8 pointer-events-none z-50 flex justify-center">
            <form
              onSubmit={(e) => void handleSend(e)}
              className={cn(
                "mx-auto transition-all duration-700 pointer-events-auto",
                !isFocused && !input ? "w-12 h-12" : "w-full max-w-3xl"
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
            >
              {!isFocused && !input ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsFocused(true);
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground shadow-2xl rounded-full hover:scale-110 active:scale-95 transition-all animate-in zoom-in spin-in-90 duration-500"
                >
                  <MessageSquare className="size-5" />
                </button>
              ) : (
                <div className="relative flex items-center bg-background/80 backdrop-blur-2xl border border-border/40 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all p-1 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500">
                  <textarea
                    ref={textareaRef}
                    placeholder="Ask a question..."
                    value={input}
                    autoFocus
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      if (!input) setIsFocused(false);
                    }}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) {
                        setInput(e.target.value);
                        adjustHeight();
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    rows={1}
                    className="w-full flex-1 resize-none bg-transparent px-4 py-2 text-sm leading-relaxed focus:outline-none disabled:cursor-not-allowed"
                    style={{ maxHeight: "160px" }}
                  />
                  <Button
                    id="send-button"
                    type="submit"
                    disabled={sending || !input.trim() || isOverLimit}
                    className="shadow-primary/10 h-9 w-9 shrink-0 rounded-none shadow-md transition-transform active:scale-95"
                    size="icon"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              )}

              {showCounter && isOverLimit && (
                <div className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/5 py-1">
                  {charsLeft} CHARACTERS OVER LIMIT
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Side Panel (Context) */}
        {showContextPanel && (
          <ContextPanel
            chunks={activeContext}
            onClose={() => setShowContextPanel(false)}
          />
        )}
      </div>
    </div >
  );
}
