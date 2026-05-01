"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  updateBot,
  deleteBot,
  generateBotApiKey,
  Bot,
} from "@/lib/api-session";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useBot } from "@/hooks/use-bot";
import { useDataSources } from "@/hooks/use-data-sources";
import { Skeleton } from "@/components/ui/skeleton";
import { PERSONA_TEMPLATES, DEFAULT_CSS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationTab } from "@/components/chatbot/IntegrationTab";
import { WidgetCustomizer } from "@/components/chatbot/WidgetCustomizer";
import { FeedbackReview } from "@/components/chatbot/FeedbackReview";
import {
  ChevronRight,
  Database,
  Globe,
  FileText,
  MessageSquareText,
  Loader2,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Trash2,
  Layout,
  ClipboardCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AgentDashboard() {
  const { Id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useUser();
  const { bot, isLoading: botLoading } = useBot(Id as string);
  const { dataSources, isLoading: sourcesLoading } = useDataSources(Id as string);

  // Form states - keeping these as useState for immediate UI feedback during typing
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [persona, setPersona] = React.useState("");
  const [customCss, setCustomCss] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | undefined>(undefined);
  const [showApiKey, setShowApiKey] = React.useState(false);

  // Initialize form state when bot data is loaded
  React.useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || "");
      const loadedPersona = bot.botPersona || "";
      setPersona(loadedPersona);
      setCustomCss(bot.customCss || DEFAULT_CSS);
      const matchedTemplate = PERSONA_TEMPLATES.find((t) => t.value === loadedPersona);
      setSelectedTemplate(matchedTemplate?.label ?? undefined);
    }
  }, [bot]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Omit<Bot, "id">>) => updateBot(Id as string, data),
    onSuccess: (updatedBot) => {
      if (updatedBot) {
        queryClient.setQueryData(["bot", Id], updatedBot);
        queryClient.invalidateQueries({ queryKey: ["bots-list"] });
        toast.success("Agent updated successfully");
      }
    },
    onError: () => toast.error("Failed to update agent"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBot(Id as string),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["bots-list"] });
        toast.success("Agent deleted successfully");
        router.push("/dashboard/chatbot");
      }
    },
    onError: () => toast.error("Failed to delete agent"),
  });

  const apiKeyMutation = useMutation({
    mutationFn: () => generateBotApiKey(Id as string),
    onSuccess: (updatedBot) => {
      if (updatedBot) {
        queryClient.setQueryData(["bot", Id], updatedBot);
        setShowApiKey(true);
        toast.success("API Key generated successfully");
      }
    },
    onError: () => toast.error("Failed to generate API Key"),
  });

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMutation.mutate({
      name,
      description,
      botPersona: persona,
      customCss: customCss,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    deleteMutation.mutate();
  };

  const handleGenerateApiKey = async () => {
    apiKeyMutation.mutate();
  };

  if (botLoading || userLoading) {
    return (
      <div className="animate-pulse space-y-8 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!bot || !user) return null;

  return (
    <div className="bg-background text-foreground flex h-full flex-col overflow-hidden">
      <main className="w-full flex-1 space-y-8 overflow-y-auto p-6 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{bot.name}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
              {bot.description || "No description available for this agent."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/dashboard/dataSource" className="hidden md:block">
              <Button variant="outline" className="rounded-none px-6">
                <FileText className="mr-2 h-4 w-4" />
                Knowledge Bases
              </Button>
            </Link>
            <Link
              href={
                dataSources.length === 0
                  ? `/dashboard/dataSource?botId=${Id}`
                  : `/dashboard/chatbot/${Id}/Playground`
              }
            >
              <Button className="rounded-none px-6">
                {dataSources.length === 0 ? "Add Data to Test" : "Test your Agent"}
              </Button>
            </Link>
            <Button
              variant="destructive"
              className="rounded-none px-6"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Agent
            </Button>
          </div>
        </div>

        <Tabs defaultValue="config" className="w-full space-y-8">
          <TabsList className="bg-muted/50 h-12 rounded-none p-1">
            <TabsTrigger
              value="config"
              className="data-[state=active]:bg-background h-10 rounded-none px-8 data-[state=active]:shadow-sm"
            >
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="integration"
              disabled={dataSources.length === 0}
              className="data-[state=active]:bg-background flex h-10 items-center gap-2 rounded-none px-8 data-[state=active]:shadow-sm"
            >
              {dataSources.length === 0 && <ShieldCheck className="h-3.5 w-3.5 opacity-70" />}
              Integration
            </TabsTrigger>
            <TabsTrigger
              value="widget"
              className="data-[state=active]:bg-background flex h-10 items-center gap-2 rounded-none px-8 data-[state=active]:shadow-sm"
            >
              <Layout className="h-3.5 w-3.5" />
              Widget
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="data-[state=active]:bg-background flex h-10 items-center gap-2 rounded-none px-8 data-[state=active]:shadow-sm"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Review (HITL)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="bg-muted/40 border-border/50 rounded-none border shadow-sm transition-all">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-semibold">Agent Settings</CardTitle>
                    <CardDescription>
                      Update your agent&apos;s identity and behavioral instructions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="update-bot-form" onSubmit={handleUpdate} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Agent Name
                          </Label>
                          <Input
                            id="name"
                            placeholder="e.g. Customer Support"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background rounded-none"
                            required
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="persona-template" className="text-sm font-medium">
                            Persona Template
                          </Label>
                          <Select
                            value={selectedTemplate ?? ""}
                            onValueChange={(label) => {
                              const template = PERSONA_TEMPLATES.find((t) => t.label === label);
                              if (template) {
                                setSelectedTemplate(template.label);
                                setPersona(template.value);
                              } else {
                                setSelectedTemplate(undefined);
                              }
                            }}
                          >
                            <SelectTrigger
                              id="persona-template"
                              className="bg-background rounded-none"
                            >
                              <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {PERSONA_TEMPLATES.map((t) => (
                                <SelectItem key={t.label} value={t.label}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="description" className="text-sm font-medium">
                          Description
                        </Label>
                        <Input
                          id="description"
                          placeholder="A brief description of what this agent does"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-background rounded-none"
                        />
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="persona" className="text-sm font-medium">
                          Instructions / Persona
                        </Label>
                        <Textarea
                          id="persona"
                          placeholder="Describe how the agent should behave, its personality, and expertise..."
                          value={persona}
                          onChange={(e) => setPersona(e.target.value)}
                          className="bg-background min-h-[150px] resize-none rounded-none"
                          required
                        />
                        <p className="text-muted-foreground text-xs">
                          Select a template above to auto-fill, or write a fully custom prompt
                          below.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      type="submit"
                      form="update-bot-form"
                      disabled={updateMutation.isPending}
                      className="h-11 rounded-none px-8"
                    >
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="space-y-6 lg:col-span-1">
                <Card className="bg-muted/40 border-border/50 h-full rounded-none border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                      <Database className="text-primary h-5 w-5" />
                      Knowledge Bases
                    </CardTitle>
                    <CardDescription>Connected data sources for RAG.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        type: "FILE",
                        label: "Documents & Files",
                        icon: FileText,
                        color: "text-blue-500",
                      },
                      {
                        type: "URL",
                        label: "Website Sync",
                        icon: Globe,
                        color: "text-emerald-500",
                      },
                      {
                        type: "TEXT",
                        label: "FAQs & Q&A",
                        icon: MessageSquareText,
                        color: "text-orange-500",
                      },
                    ].map((source) => {
                      const items = dataSources.filter((ds) => ds.type === source.type);
                      const isAdded = items.length > 0;

                      return (
                        <div
                          key={source.type}
                          className="bg-background border-border/50 hover:border-primary/20 flex items-center justify-between rounded-none border p-4 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`bg-muted rounded-none p-2 ${source.color}`}>
                              <source.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm leading-none font-medium">{source.label}</p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {isAdded
                                  ? `${items.length} source(s) connected`
                                  : "No data added yet"}
                              </p>
                            </div>
                          </div>
                          {isAdded ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Link href={`/dashboard/dataSource`}>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Link href={`/dashboard/chatbot/${Id}/data-sources`} className="w-full">
                      <Button variant="outline" className="group w-full rounded-none">
                        Manage Sources
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="integration"
            className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-300"
          >
            <IntegrationTab
              bot={bot}
              customCss={customCss}
              setCustomCss={setCustomCss}
              handleUpdate={handleUpdate}
              updating={updateMutation.isPending}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
              handleGenerateApiKey={handleGenerateApiKey}
              defaultCss={DEFAULT_CSS}
            />
          </TabsContent>

          <TabsContent value="widget" className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-300">
            <WidgetCustomizer bot={bot} onUpdate={(updatedBot) => queryClient.setQueryData(["bot", Id], updatedBot)} />
          </TabsContent>

          <TabsContent value="review" className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-300">
            <FeedbackReview botId={bot.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
