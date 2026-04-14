"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot as BotIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getChat, addMessage, createChat, Bot, Message } from "@/lib/api-session";

interface ChatInterfaceProps {
  bot: Bot;
  userId: string;
  className?: string;
}

export function ChatInterface({ bot, userId, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      setInitializing(true);
      try {
        // For simplicity, we create a new chat every time or fetch the last one
        // In a real app, you might want to list previous chats
        const chat = await createChat({ userId, botId: bot.id });
        if (chat) {
          setChatId(chat.id);
          setMessages(chat.messages || []);
        }
      } catch (error) {
        console.error("Failed to initialize chat", error);
        toast.error("Failed to start chat session");
      } finally {
        setInitializing(false);
      }
    };

    initChat();
  }, [bot.id, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || loading) return;

    const userMessageContent = input.trim();
    setInput("");

    // Optimistic update
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: userMessageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setLoading(true);
    try {
      const response = await addMessage(chatId, userMessageContent);
      if (response) {
        setMessages((prev) => [...prev, response]);
      } else {
        toast.error("Failed to get response from agent");
      }
    } catch (error) {
      toast.error("An error occurred while sending message");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <Card
        className={`border-border/60 flex h-full flex-col rounded-none shadow-none ${className || ""}`}
      >
        <CardHeader className="border-border/40 border-b py-4">
          <Skeleton className="h-6 w-48 rounded-none" />
        </CardHeader>
        <CardContent className="flex-1 space-y-4 p-6">
          <Skeleton className="h-12 w-3/4 rounded-none" />
          <Skeleton className="ml-auto h-12 w-1/2 rounded-none" />
          <Skeleton className="h-12 w-2/3 rounded-none" />
        </CardContent>
        <CardFooter className="border-border/40 border-t p-4">
          <Skeleton className="h-10 w-full rounded-none" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={`border-border/60 bg-background/50 flex h-full flex-col overflow-hidden rounded-none shadow-none backdrop-blur-sm ${className || ""}`}
    >
      <CardHeader className="border-border/40 bg-muted/20 flex flex-row items-center justify-between border-b py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 flex size-8 items-center justify-center rounded-none border">
            <BotIcon className="text-primary size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{bot.name}</CardTitle>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Active Session
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="rounded-none text-[10px] font-bold tracking-tighter uppercase"
        >
          RAG Enabled
        </Badge>
      </CardHeader>

      <CardContent className="relative flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto scroll-smooth p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center opacity-40">
                <BotIcon className="text-muted-foreground mb-4 size-12" />
                <p className="text-sm font-medium">Start a conversation with {bot.name}</p>
                <p className="text-muted-foreground mt-1 max-w-[200px] text-xs">
                  Ask questions and get answers based on your data sources.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "USER" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="border-border/60 size-8 rounded-none border">
                    <AvatarFallback className="rounded-none text-[10px] font-bold">
                      {msg.role === "USER" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 text-sm ${
                      msg.role === "USER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border-border/60 border"
                    }`}
                  >
                    {msg.content}
                    {msg.metadata?.source_chunks && (
                      <div className="border-border/20 mt-2 border-t pt-2 text-[9px] font-bold tracking-widest uppercase opacity-60">
                        Sourced from {msg.metadata.source_chunks} chunks
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="border-border/60 size-8 rounded-none border">
                  <AvatarFallback className="rounded-none text-[10px] font-bold">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted border-border/60 border px-4 py-2.5">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-border/40 bg-background border-t p-4">
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="border-border/60 focus-visible:border-primary rounded-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="shadow-primary/20 shrink-0 rounded-none shadow-lg"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
