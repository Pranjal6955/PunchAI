"use client";

import { useState } from "react";
import { BotCard } from "@/components/dashboard/bot-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LayoutGrid, List, Bot as BotIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useBots } from "@/hooks/use-bots";
import { useUser } from "@/hooks/use-user";

export default function ChatbotsPage() {
  const { bots, isLoading: botsLoading, mutate: mutateBots, removeBot } = useBots();
  const { user: profile } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadingInitial = botsLoading && bots.length === 0;

  const fetchBots = async () => {
    await mutateBots();
  };

  const handleDeleteBot = async (botId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this agent? This will also delete all associated messages and data source connections."
      )
    ) {
      return;
    }
    await removeBot(botId);
  };

  const filteredBots = bots.filter((bot) => {
    return (
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loadingInitial && bots.length === 0) {
    return (
      <div className="min-h-full w-full space-y-8 p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48 rounded-none" />
            <Skeleton className="h-4 w-64 rounded-none" />
          </div>
          <Skeleton className="h-10 w-36 rounded-none" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full space-y-8 p-4 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 px-1 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your Agents</h1>
          <p className="text-muted-foreground text-lg">
            Manage your AI chatbots and their retrieval context.
          </p>
        </div>
        <CreateAgentDialog onSuccess={fetchBots} />
      </div>

      {/* Toolbar */}
      <div className="bg-muted/30 border-border/40 flex flex-col items-start justify-between gap-4 border p-2 backdrop-blur-sm lg:flex-row lg:items-center">
        <div className="group relative w-full lg:max-w-md">
          <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
          <Input
            placeholder="Search agents by name or persona..."
            className="border-border/60 bg-background focus-visible:border-primary h-10 rounded-none pl-9 transition-all focus:ring-0 focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="border-border/60 bg-background flex shrink-0 border p-0.5">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none shadow-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-none shadow-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bots Display */}
      {filteredBots.length === 0 ? (
        <Card className="rounded-none border-2 border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted mb-6 flex size-16 items-center justify-center rounded-none">
              <BotIcon className="text-muted-foreground size-8" />
            </div>
            <h3 className="text-2xl font-medium">No agents found</h3>
            <p className="text-muted-foreground mx-auto mt-2 mb-8 max-w-md">
              {searchQuery
                ? "No agents match your current search. Try a different name."
                : "Get started by creating your first AI agent. Define its personality and connect data sources."}
            </p>
            {!searchQuery ? (
              <CreateAgentDialog onSuccess={fetchBots} />
            ) : (
              <Button variant="outline" className="rounded-none" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredBots.map((bot, index) => (
              <motion.div
                key={bot.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <BotCard bot={bot} onDelete={handleDeleteBot} viewMode="grid" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="border-border/60 bg-card overflow-hidden border">
          <div className="border-border/60 text-muted-foreground bg-muted/30 grid grid-cols-12 gap-4 border-b px-6 py-3 text-[10px] font-semibold tracking-widest uppercase">
            <div className="col-span-6 flex items-center">Agent Name</div>
            <div className="col-span-2 flex items-center">Sources</div>
            <div className="col-span-2 flex items-center">Created</div>
            <div className="col-span-2 flex items-center justify-end">Actions</div>
          </div>
          <AnimatePresence mode="popLayout">
            {filteredBots.map((bot) => (
              <motion.div
                key={bot.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BotCard bot={bot} onDelete={handleDeleteBot} viewMode="list" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
