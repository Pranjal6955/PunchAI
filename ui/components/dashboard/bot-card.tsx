"use client";

import { Bot } from "@/lib/api-session";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Trash2,
  MessageSquare,
  Database,
  Bot as BotIcon,
  ExternalLink,
  EyeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

interface BotCardProps {
  bot: Bot;
  onDelete: (id: string) => void;
  viewMode: "grid" | "list";
}

export function BotCard({ bot, onDelete, viewMode }: BotCardProps) {
  if (viewMode === "list") {
    return (
      <div className="hover:bg-muted/50 grid grid-cols-12 items-center gap-4 border-b px-6 py-4 transition-colors last:border-0">
        <div className="col-span-6 truncate pr-4 text-sm font-medium">
          <Link
            href={`/dashboard/chatbot/${bot.id}`}
            className="flex items-center gap-3 hover:underline"
          >
            <BotIcon className="text-muted-foreground size-4" />
            {bot.name}
          </Link>
        </div>
        <div className="text-muted-foreground col-span-2 flex items-center gap-2 text-sm">
          <Database className="size-3.5" />
          {bot.dataSourceCount || 0}
        </div>
        <div className="text-muted-foreground col-span-2 text-xs">
          {new Date(bot.createdAt).toLocaleDateString()}
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <Link
            href={
              (bot.dataSourceCount || 0) === 0
                ? `/dashboard/dataSource?botId=${bot.id}`
                : `/dashboard/chatbot/${bot.id}/Playground`
            }
            className=""
          >
            <Button variant="ghost" size="icon" className="rounded-none">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-none">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer rounded-none"
                onClick={() => onDelete(bot.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className="flex h-full flex-col rounded-none transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex gap-3">
          <div className="mt-1 flex-shrink-0">
            <BotIcon className="text-primary size-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">{bot.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {bot.description || "No description provided."}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-none">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuItem asChild className="cursor-pointer rounded-none">
              <Link
                href={
                  (bot.dataSourceCount || 0) === 0
                    ? `/dashboard/dataSource?botId=${bot.id}`
                    : `/dashboard/chatbot/${bot.id}/Playground`
                }
                className=""
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {(bot.dataSourceCount || 0) === 0 ? "Add Data to Chat" : "Open Chat"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer rounded-none"
              onClick={() => onDelete(bot.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Database className="size-4" />
            <span>{bot.dataSourceCount || 0} Sources</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 px-6">
        <Link href={`/dashboard/chatbot/${bot.id}`} className="w-full">
          <Button variant="outline" className="h-9 w-full gap-2 rounded-none text-xs">
            <EyeIcon className="h-4 w-4" />
            View Details
          </Button>
        </Link>
        <Link
          href={
            (bot.dataSourceCount || 0) === 0
              ? `/dashboard/dataSource?botId=${bot.id}`
              : `/dashboard/chatbot/${bot.id}/Playground`
          }
          className="w-full"
        >
          <Button className="h-9 w-full gap-2 rounded-none text-xs">
            <MessageSquare className="h-4 w-4" />
            {(bot.dataSourceCount || 0) === 0 ? "Add Data to Chat" : "Chat with Agent"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
