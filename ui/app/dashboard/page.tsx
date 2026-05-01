"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Brain, 
  Database, 
  MessageSquare, 
  TrendingUp,
  Zap,
  ArrowRight,
  Plus,
  Activity,
  History,
  Bot as BotIcon
} from "lucide-react";
import Link from "next/link";
import { useBots } from "@/hooks/use-bots";
import { useUser } from "@/hooks/use-user";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { bots, isLoading: botsLoading, mutate: mutateBots } = useBots();
  const { user, isLoading: userLoading } = useUser();
  const [isDeleting] = useState<string | null>(null);

  if (userLoading || botsLoading) {
    return <PageSkeleton />;
  }

  const botsArray = Array.isArray(bots) ? bots : [];
  const totalChats = botsArray.length;
  const totalDataSources = botsArray.reduce((sum, bot) => sum + (bot.dataSourceCount || 0), 0);
  const recentBots = botsArray.slice(0, 3);

  return (
    <div className="space-y-8 p-4 md:p-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 px-1 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, {user?.name?.split(' ')[0] || "User"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor your AI agents and data infrastructure.
          </p>
        </div>
        <div className="flex gap-3">
            <CreateAgentDialog onSuccess={() => mutateBots()} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Brain}
          label="Active Agents"
          value={totalChats}
          description="Deployments"
        />
        <StatCard 
          icon={Database}
          label="Knowledge Bases"
          value={totalDataSources}
          description="Data connections"
        />
        <StatCard 
          icon={MessageSquare}
          label="Conversations"
          value={botsArray.length > 0 ? "—" : "0"}
          description="Total inference"
        />
        <StatCard 
          icon={Activity}
          label="System Health"
          value="Optimal"
          description="All services online"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Chatbots Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-2xl font-semibold tracking-tight">Recent Agents</h2>
                <Link href="/dashboard/chatbot">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-none">
                        View All <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
            
            <div className="border border-border/60 bg-card overflow-hidden">
                {botsArray.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-muted mb-6 flex size-16 items-center justify-center">
                            <BotIcon className="text-muted-foreground size-8" />
                        </div>
                        <h3 className="text-xl font-medium">No agents active</h3>
                        <p className="text-muted-foreground mx-auto mt-2 mb-8 max-w-sm">
                            Create your first AI agent to start building your knowledge base.
                        </p>
                        <CreateAgentDialog onSuccess={() => mutateBots()} />
                    </div>
                ) : (
                    <div className="divide-y divide-border/60">
                    {recentBots.map((bot) => (
                        <div 
                        key={bot.id}
                        className="group flex items-center justify-between p-5 transition-colors hover:bg-muted/30"
                        >
                        <div className="flex flex-1 items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center bg-muted">
                                <Brain className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <Link 
                                    href={`/dashboard/chatbot/${bot.id}`}
                                    className="font-medium hover:underline decoration-primary/30 underline-offset-4"
                                >
                                    {bot.name}
                                </Link>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    {bot.dataSourceCount || 0} sources • v1.0
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/chatbot/${bot.id}/Playground`}>
                                <Button variant="secondary" size="sm" className="rounded-none h-8 text-xs">
                                    Chat
                                </Button>
                            </Link>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-8">
            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight px-1">Quick Actions</h2>
                <div className="grid gap-3">
                    <DashboardAction 
                        icon={Database}
                        title="Add Data Source"
                        href="/dashboard/dataSource"
                    />
                    <DashboardAction 
                        icon={History}
                        title="View Chat Logs"
                        href="/dashboard/chatlogs"
                    />
                    <DashboardAction 
                        icon={TrendingUp}
                        title="Usage Analytics"
                        href="/dashboard/analytics"
                    />
                </div>
            </div>

            {/* Guide Card */}
            <Card className="rounded-none border-border/60 bg-muted/20 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Platform Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <StepItem step="1" text="Create your AI persona" />
                        <StepItem step="2" text="Upload knowledge documents" />
                        <StepItem step="3" text="Integrate the chat widget" />
                    </div>
                    <Button variant="outline" className="w-full rounded-none h-10 mt-2 text-xs">
                        View Documentation
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ icon: Icon, label, value, description }: { icon: any, label: string, value: string | number, description: string }) {
    return (
        <Card className="rounded-none border-border/60 bg-card p-6 shadow-none">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{description}</p>
        </Card>
    )
}

function DashboardAction({ icon: Icon, title, href }: { icon: any, title: string, href: string }) {
    return (
        <Link href={href}>
            <div className="group flex items-center justify-between border border-border/60 bg-card p-4 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </div>
        </Link>
    )
}

function StepItem({ step, text }: { step: string, text: string }) {
    return (
        <div className="flex gap-3 items-center">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-none bg-primary/10 text-[10px] font-bold text-primary">{step}</span>
            <span className="text-xs font-medium text-muted-foreground">{text}</span>
        </div>
    )
}


