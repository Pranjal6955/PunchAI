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
  Plus
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
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name || "User"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your AI chatbots and data sources
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Brain}
          label="Active Chatbots"
          value={totalChats}
          description="AI agents deployed"
          color="from-blue-500/10 to-blue-500/5"
          iconColor="text-blue-600"
        />
        <StatCard 
          icon={Database}
          label="Data Sources"
          value={totalDataSources}
          description="Connected knowledge bases"
          color="from-purple-500/10 to-purple-500/5"
          iconColor="text-purple-600"
        />
        <StatCard 
          icon={MessageSquare}
          label="Total Conversations"
           value={botsArray.length > 0 ? "—" : "0"}
          description="Across all chatbots"
          color="from-emerald-500/10 to-emerald-500/5"
          iconColor="text-emerald-600"
        />
        <StatCard 
          icon={TrendingUp}
          label="Engagement Rate"
           value="—"
          description="User satisfaction"
          color="from-amber-500/10 to-amber-500/5"
          iconColor="text-amber-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          icon={Plus}
          title="Create New Chatbot"
          description="Build and deploy a new AI agent"
          href="/dashboard/chatbot"
          action={<CreateAgentDialog onSuccess={() => mutateBots()} />}
        />
        <QuickActionCard
          icon={Database}
          title="Upload Data Source"
          description="Add PDFs, URLs, or FAQs"
          href="/dashboard/dataSource"
          actionLabel="Upload Now"
        />
        <QuickActionCard
          icon={BarChart3}
          title="View Analytics"
          description="Monitor usage and performance"
          href="/dashboard/analytics"
          actionLabel="Explore"
        />
      </div>

      {/* Recent Chatbots Section */}
      <Card className="rounded-none border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Your Chatbots</CardTitle>
            <CardDescription>
              {totalChats === 0 
                ? "Create your first chatbot to get started" 
                : `You have ${totalChats} active chatbot${totalChats !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <Link href="/dashboard/chatbot">
            <Button variant="outline" size="sm" className="gap-2 rounded-none">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {botsArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-center text-muted-foreground">
                No chatbots yet. Create one to get started!
              </p>
              <CreateAgentDialog onSuccess={() => mutateBots()} />
            </div>
          ) : (
            <div className="space-y-3">
              {recentBots.map((bot) => (
                <div 
                  key={bot.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-3 transition-colors"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <Brain className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link 
                        href={`/dashboard/chatbot/${bot.id}`}
                        className="font-medium hover:underline"
                      >
                        {bot.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {bot.dataSourceCount || 0} data source{bot.dataSourceCount !== 1 ? 's' : ''} • Created {new Date(bot.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/chatbot/${bot.id}/Playground`}>
                      <Button variant="ghost" size="sm" className="gap-2 rounded-none">
                        <MessageSquare className="h-4 w-4" /> Chat
                      </Button>
                    </Link>
                    {isDeleting === bot.id && (
                      <span className="text-xs text-muted-foreground">Deleting...</span>
                    )}
                  </div>
                </div>
              ))}
              {totalChats > 3 && (
                <Link href="/dashboard/chatbot" className="block">
                  <Button variant="ghost" className="w-full gap-2 rounded-none">
                    View all {totalChats} chatbots <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card className="border bg-linear-to-br from-primary/5 to-primary/10 rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
             {getQuickStartSteps().map((item) => (
              <div key={item.step} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="ml-11 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get quick start steps
function getQuickStartSteps() {
  return [
    {
      step: "1",
      title: "Create an Agent",
      description: "Set up your first AI chatbot with a custom persona and instructions"
    },
    {
      step: "2",
      title: "Add Knowledge",
      description: "Upload PDFs, URLs, or FAQ documents to train your chatbot"
    },
    {
      step: "3",
      title: "Deploy & Chat",
      description: "Start conversations and monitor performance in the playground"
    }
  ];
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  description,
  color,
  iconColor
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  description: string;
  color: string;
  iconColor: string;
}) {
  return (
    <Card className={cn("rounded-none border", color)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Quick Action Card Component
function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  href,
  actionLabel,
  action
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-none border transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="pt-1">{description}</CardDescription>
          </div>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {action ? (
          action
        ) : (
          <Link href={href || "#"}>
            <Button variant="outline" size="sm" className="gap-2 rounded-none w-full">
              {actionLabel || "Get Started"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
