"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { getBot, getProfile, addMessage, createChat, Bot, User, Message } from "@/lib/api-session";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Send, ArrowLeft, Bot as BotIcon, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PlaygroundPage() {
  const { Id } = useParams();
  const router = useRouter();

  const [bot, setBot] = React.useState<Bot | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Chat states
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [chatId, setChatId] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!Id) return;
      try {
        const [botData, profile] = await Promise.all([getBot(Id as string), getProfile()]);

        if (botData && profile) {
          setBot(botData);
          setUser(profile);

          // Initialize chat session
          const chat = await createChat({ userId: profile.id, botId: botData.id });
          if (chat) {
            setChatId(chat.id);
            setMessages(chat.messages || []);
          }
        } else {
          toast.error("Data could not be loaded");
          router.push("/dashboard/chatbot");
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [Id, router]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || sending) return;

    const userContent = input.trim();
    setInput("");

    // Optimistic update
    const tempMsg: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: userContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    setSending(true);
    try {
      const reply = await addMessage(chatId, userContent);
      if (reply) {
        setMessages((prev) => [...prev, reply]);
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

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
      {/* Simple Header */}
      <div className="border-border/40 flex h-16 items-center gap-4 border-b px-6">
        <Link href={`/dashboard/chatbot/${Id}`}>
          <Button variant="ghost" size="icon" className="hover:bg-muted h-8 w-8 rounded-none">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 flex size-8 items-center justify-center rounded-none border">
            <BotIcon className="text-primary size-4" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase">{bot.name}</span>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="bg-muted/5 flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BotIcon className="text-primary/40 mb-6 size-16" />
              <h2 className="mb-2 text-xl font-bold tracking-tight uppercase">
                Start a New Conversation
              </h2>
              <p className="text-muted-foreground mb-12 max-w-sm text-sm font-medium">
                Ask {bot.name} anything about your connected data sources.
              </p>

              <div className="grid w-full max-w-md gap-3">
                {[
                  "Tell me about the documents you've processed.",
                  "What are the key takeaways from your data?",
                  "Help me understand how you can assist me.",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      // Trigger send by manually calling or setting state
                      // Since we're in a click handler, we can just call the logic
                      const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                      setTimeout(() => {
                        const btn = document.getElementById("send-button");
                        btn?.click();
                      }, 10);
                    }}
                    className="border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 group flex items-center justify-between border px-6 py-4 text-left text-[11px] font-bold tracking-widest uppercase transition-all"
                  >
                    {q}
                    <Send className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "USER" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-none border ${msg.role === "USER" ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"}`}
                >
                  {msg.role === "USER" ? (
                    <UserIcon className="size-4" />
                  ) : (
                    <BotIcon className="size-4" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] border px-5 py-3 text-sm leading-relaxed ${msg.role === "USER"
                      ? "bg-primary/5 border-primary/20 text-foreground"
                      : "bg-background border-border shadow-sm"
                    }`}
                >
                  {msg.role === "USER" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        code: ({ children }) => <code className="bg-black/10 rounded px-1 py-0.5 font-mono text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="bg-black/10 mb-2 overflow-x-auto rounded p-3 font-mono text-xs">{children}</pre>,
                        h1: ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
                        h2: ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
                        h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-4">
              <div className="border-border bg-background flex size-8 shrink-0 items-center justify-center rounded-none border">
                <BotIcon className="size-4" />
              </div>
              <div className="bg-background border-border border px-5 py-3 shadow-sm">
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple Input Bar */}
      <div className="bg-background border-border/40 border-t p-4 md:p-8">
        <form onSubmit={handleSend} className="mx-auto flex max-w-3xl gap-3">
          <Input
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="border-border/60 focus-visible:border-primary bg-muted/5 h-12 rounded-none px-5 whitespace-pre-wrap focus-visible:ring-0"
          />
          <Button
            id="send-button"
            type="submit"
            disabled={sending || !input.trim()}
            className="shadow-primary/20 h-12 shrink-0 rounded-none px-6 shadow-lg"
          >
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
