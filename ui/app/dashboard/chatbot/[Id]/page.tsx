"use client"

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    getBot,
    getProfile,
    updateBot,
    deleteBot,
    getDataSources,
    Bot,
    DataSource
} from "@/lib/api-session";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Code2, Terminal, Copy, ExternalLink, ShieldCheck, Zap,
    Loader2, FileText, Globe, MessageSquareText, Plus, CheckCircle2, ChevronRight, Database, UserRound,
    Trash2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const PERSONA_TEMPLATES = [
    {
        label: "Helpful Assistant",
        value: "You are a helpful, friendly, and concise AI assistant. Your goal is to provide accurate information and assist the user with their queries in a professional manner.",
    },
    {
        label: "Technical Expert",
        value: "You are an expert software engineer and technical consultant. Provide deep technical insights, code examples, and architectural advice. Be precise and thorough.",
    },
    {
        label: "Customer Support",
        value: "You are a highly empathetic customer support representative. Aim to resolve issues with patience and clarity. Always be polite and offer to help further.",
    },
    {
        label: "Creative Writer",
        value: "You are a versatile creative writer. Help the user brainstorm ideas, write stories, poems, or marketing copy. Use vivid language and be highly imaginative.",
    },
    {
        label: "Data Analyst",
        value: "You are a data science expert. Help users interpret data, write SQL queries, and explain statistical concepts in simple terms.",
    },
];

export default function AgentDashboard() {
    const { Id } = useParams();
    const router = useRouter();
    const [bot, setBot] = React.useState<Bot | null>(null);
    const [user, setUser] = React.useState<any>(null);
    const [dataSources, setDataSources] = React.useState<DataSource[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [updating, setUpdating] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);

    // Form states
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [persona, setPersona] = React.useState("");
    const [selectedTemplate, setSelectedTemplate] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!Id) return;
            try {
                const [botData, profile, sources] = await Promise.all([
                    getBot(Id as string),
                    getProfile(),
                    getDataSources(Id as string)
                ]);

                if (botData) {
                    setBot(botData);
                    setName(botData.name);
                    setDescription(botData.description || "");
                    const loadedPersona = botData.botPersona || "";
                    setPersona(loadedPersona);
                    // Pre-select the matching template if the stored persona matches one
                    const matchedTemplate = PERSONA_TEMPLATES.find(t => t.value === loadedPersona);
                    setSelectedTemplate(matchedTemplate?.label ?? undefined);
                    setDataSources(sources || []);
                } else {
                    toast.error("Agent not found");
                    router.push("/dashboard/chatbot");
                }
                setUser(profile);
            } catch (error) {
                console.error("Failed to fetch agent", error);
            } finally {
                setLoading(false);
            }
        };
        void fetchData();
    }, [Id, router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bot || !Id) return;

        setUpdating(true);
        try {
            const updatedBot = await updateBot(Id as string, {
                name,
                description,
                botPersona: persona
            });

            if (updatedBot) {
                setBot(updatedBot);
                toast.success("Agent updated successfully");
            } else {
                toast.error("Failed to update agent");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("An error occurred while updating");
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!bot || !Id) return;
        if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

        setDeleting(true);
        try {
            const success = await deleteBot(Id as string);
            if (success) {
                toast.success("Agent deleted successfully");
                router.push("/dashboard/chatbot");
            } else {
                toast.error("Failed to delete agent");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("An error occurred while deleting");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!bot || !user) return null;

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 w-full p-6 lg:p-10 space-y-8 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">{bot.name}</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            {bot.description || "No description available for this agent."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href={dataSources.length === 0 ? `/dashboard/dataSource?botId=${Id}` : `/dashboard/chatbot/${Id}/Playground`}
                            className=""
                        >
                            <Button
                                className="rounded-none px-6"
                            >
                                {dataSources.length === 0 ? "Add Data to Test" : "Test your Agent"}
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            className="rounded-none px-6"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete Agent
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="rounded-none border shadow-sm bg-muted/40 transition-all border-border/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-semibold">Agent Settings</CardTitle>
                                <CardDescription>
                                    Update your agent's identity and behavioral instructions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form id="update-bot-form" onSubmit={handleUpdate} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="name" className="text-sm font-medium">Agent Name</Label>
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
                                            <Label htmlFor="persona-template" className="text-sm font-medium">Persona Template</Label>
                                            <Select
                                                value={selectedTemplate ?? ""}
                                                onValueChange={(label) => {
                                                    const template = PERSONA_TEMPLATES.find(t => t.label === label);
                                                    if (template) {
                                                        setSelectedTemplate(template.label);
                                                        setPersona(template.value);
                                                    } else {
                                                        setSelectedTemplate(undefined);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="persona-template" className="rounded-none bg-background">
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
                                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="A brief description of what this agent does"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="bg-background rounded-none"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label htmlFor="persona" className="text-sm font-medium">Instructions / Persona</Label>
                                        <Textarea
                                            id="persona"
                                            placeholder="Describe how the agent should behave, its personality, and expertise..."
                                            value={persona}
                                            onChange={(e) => setPersona(e.target.value)}
                                            className="min-h-[150px] bg-background resize-none rounded-none"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Select a template above to auto-fill, or write a fully custom prompt below.
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button
                                    type="submit"
                                    form="update-bot-form"
                                    disabled={updating}
                                    className="rounded-none px-8 h-11"
                                >
                                    {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-none border shadow-sm bg-muted/40 h-full border-border/50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    Knowledge Bases
                                </CardTitle>
                                <CardDescription>
                                    Connected data sources for RAG.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { type: "FILE", label: "Documents & Files", icon: FileText, color: "text-blue-500" },
                                    { type: "URL", label: "Website Sync", icon: Globe, color: "text-emerald-500" },
                                    { type: "TEXT", label: "FAQs & Q&A", icon: MessageSquareText, color: "text-orange-500" },
                                ].map((source) => {
                                    const items = dataSources.filter(ds => ds.type === source.type);
                                    const isAdded = items.length > 0;

                                    return (
                                        <div key={source.type} className="flex items-center justify-between p-4 bg-background border border-border/50 transition-colors hover:border-primary/20 rounded-none">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-none bg-muted ${source.color}`}>
                                                    <source.icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{source.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {isAdded ? `${items.length} source(s) connected` : "No data added yet"}
                                                    </p>
                                                </div>
                                            </div>
                                            {isAdded ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <Link href={`/dashboard/chatbot/${Id}/data-sources`}>
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
                                    <Button variant="outline" className="w-full rounded-none group">
                                        Manage Sources
                                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

            </main>
        </div>
    );
}
