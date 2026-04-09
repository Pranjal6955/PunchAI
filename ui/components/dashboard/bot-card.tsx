"use client"

import { Bot } from "@/lib/api-session";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Trash2,
    MessageSquare,
    Database,
    Bot as BotIcon,
    ExternalLink,
    EyeIcon
} from "lucide-react";
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
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-0 hover:bg-muted/50 transition-colors items-center">
                <div className="col-span-6 font-medium text-sm truncate pr-4">
                    <Link href={`/dashboard/chatbot/${bot.id}`} className="hover:underline flex items-center gap-3">
                        <BotIcon className="size-4 text-muted-foreground" />
                        {bot.name}
                    </Link>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="size-3.5" />
                    {bot.dataSourceCount || 0}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                    {new Date(bot.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                    <Link href={`/dashboard/chatbot/${bot.id}`}>
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
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow rounded-none">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                        <BotIcon className="size-10 text-primary" />
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
                            <Link href={`/dashboard/chatbot/${bot.id}`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Open Chat
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
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Database className="size-4" />
                        <span>{bot.dataSourceCount || 0} Sources</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 px-6">
                <Link href={`/dashboard/chatbot/${bot.id}`} className="w-full">
                    <Button variant="outline" className="w-full rounded-none gap-2 h-9 text-xs">
                        <EyeIcon className="h-4 w-4" />
                        View Details
                    </Button>
                </Link>
                <Link href={`/dashboard/chatbot/${bot.id}`} className="w-full">
                    <Button className="w-full rounded-none gap-2 h-9 text-xs">
                        <MessageSquare className="h-4 w-4" />
                        Chat with Agent
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
