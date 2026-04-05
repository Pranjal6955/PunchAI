"use client"

import { useEffect, useState } from "react";
import { getProfile, getBots, Bot, BotStats, getBotStats, getUserStats } from "@/lib/api-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LayoutGrid, Activity, Users, Zap, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalRequests: number;
    avgSuccessRate: number;
    totalMembers: number;
  }>({
    totalRequests: 0,
    avgSuccessRate: 0,
    totalMembers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prof, fetchedBots, userStats] = await Promise.all([
          getProfile(),
          getBots(),
          getUserStats()
        ]);
        setProfile(prof);
        setBots(fetchedBots);

        if (userStats) {
          setStats({
            totalRequests: userStats.totalRequests,
            avgSuccessRate: userStats.successRate,
            totalMembers: userStats.totalMembers,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-8 w-full min-h-full mx-auto">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-none" />
            <Skeleton className="h-4 w-48 rounded-none" />
          </div>
          <Skeleton className="h-10 w-32 rounded-none" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-none" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-none" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 w-full bg-background text-foreground">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Welcome back, {profile?.name || "User"}
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Monitor your chatbot metrics and manage your AI infrastructure.
          </p>
        </div>
        <Link href="/dashboard/chatbots">
          <Button className="rounded-none px-6 h-11 text-base shadow-none">
            <Plus className="mr-2 h-5 w-5" />
            New Chatbot
          </Button>
        </Link>
      </section>

      {/* Summary Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="rounded-none border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Chatbots</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{bots.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active deployments</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="rounded-none border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all chatbots</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="rounded-none border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Success Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.avgSuccessRate}%</div>
              <div className="w-full bg-muted h-1 rounded-none mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-1000"
                  style={{ width: `${stats.avgSuccessRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="rounded-none border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">Collaborators</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Chatbots List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Chatbots</h2>
          <Link href="/dashboard/chatbots">
            <Button variant="link" className="text-primary p-0 h-auto font-medium group text-sm">
              View All <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {bots.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent rounded-none shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-none bg-muted flex items-center justify-center mb-4">
                <LayoutGrid className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No chatbots yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-8">
                Create your first chatbot to start monitoring your API requests and collaborating with your team.
              </p>
              <Link href="/dashboard/chatbots">
                <Button variant="default" className="rounded-none px-8">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Chatbot
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bots.slice(0, 6).map((bot, index) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/dashboard/chatbots/${bot.id}`}>
                  <Card className="group relative rounded-none border-border/60 bg-background/95 shadow-none h-full hover:bg-muted/30 transition-colors">
                    <CardHeader className="pb-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="rounded-none capitalize font-medium px-2 py-0">
                          {bot.dataSourceCount || 0} Data Sources
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {bot.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1.5 text-sm">
                          {bot.description || "No description provided."}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs pt-4 border-t border-border/40 uppercase tracking-tight font-medium">
                        <span className="text-muted-foreground">
                          Created {new Date(bot.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-1.5 text-primary">
                          View details <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Support Section - Simplified for consistency */}
      <section className="border border-border bg-card p-8 md:p-12 rounded-none relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Supercharge your development workflow</h2>
          <p className="text-muted-foreground text-base md:text-lg">
            A webapp for Chatbot as a Service where users can customize and integrate chatbots to their websites with Punch Studio.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button className="rounded-none px-8 h-11">Read Documentation</Button>
            <Button variant="outline" className="rounded-none px-8 h-11 shadow-none">Community Support</Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </section>
    </div>
  );
}
