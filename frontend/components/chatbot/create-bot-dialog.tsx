"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Bot, Sparkles, Shield, Zap, Terminal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createBot } from "@/lib/api-session"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"

const BOT_PERSONA_PRESETS = [
    {
        id: "professional",
        name: "Professional Assistant",
        icon: Shield,
        description: "Formal and structured, ideal for business settings.",
        prompt: "You are a professional and formal assistant. Provide well-structured, polite, and helpful responses."
    },
    {
        id: "friendly",
        name: "Friendly Sidekick",
        icon: Sparkles,
        description: "Warm and enthusiastic, great for informal engagement.",
        prompt: "You are a friendly and enthusiastic assistant. Use a warm, approachable tone and feel free to use emojis to keep a positive vibe."
    },
    {
        id: "technical",
        name: "Technical Guru",
        icon: Terminal,
        description: "Expert level accuracy for solving complex problems.",
        prompt: "You are a highly skilled technical expert. Provide detailed, accurate, and expert-level technical answers with a focus on problem-solving."
    },
    {
        id: "concise",
        name: "Concise Strategist",
        icon: Zap,
        description: "Direct and efficient answers getting straight to the point.",
        prompt: "You are a direct and concise assistant. Get straight to the point and provide clear, efficient answers without unnecessary preamble."
    },
    {
        id: "custom",
        name: "Custom Persona",
        icon: Bot,
        description: "Write your own custom system instructions.",
        prompt: ""
    }
];

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Chatbot name must be at least 2 characters.",
    }),
    description: z.string().optional(),
    botPersona: z.string().min(1, {
        message: "Please provide a bot persona or instruction.",
    }),
})

interface CreateBotDialogProps {
    onSuccess?: () => void | Promise<void>;
    trigger?: React.ReactNode;
}

export function CreateBotDialog({ onSuccess, trigger }: CreateBotDialogProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [selectedPreset, setSelectedPreset] = React.useState("professional")

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            botPersona: BOT_PERSONA_PRESETS[0].prompt,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await createBot(values);
            if (result) {
                toast.success("Chatbot created successfully!");
                setOpen(false);
                reset();
                if (onSuccess) {
                    await onSuccess();
                } else {
                    router.refresh();
                }
            } else {
                toast.error("Failed to create chatbot");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                reset();
                setSelectedPreset("professional");
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Chatbot
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-none border border-border/60 bg-background/95 p-0 overflow-hidden">
                <div className="p-6 space-y-6">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl font-semibold tracking-tight">Create New Chatbot</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Define your chatbot's identity and its underlying personality.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Chatbot Name</FieldLabel>
                                <Input
                                    id="name"
                                    placeholder="e.g. Customer Support Bot"
                                    className="rounded-none border-border/60 focus-visible:ring-ring"
                                    {...register("name")}
                                    disabled={isLoading}
                                />
                                {errors.name && <FieldError>{errors.name.message}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="description">Description (Optional)</FieldLabel>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe the purpose of this chatbot..."
                                    className="rounded-none border-border/60 focus-visible:ring-ring min-h-[80px] resize-none text-sm"
                                    {...register("description")}
                                    disabled={isLoading}
                                />
                                {errors.description && <FieldError>{errors.description.message}</FieldError>}
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field>
                                    <FieldLabel htmlFor="preset">Persona Preset</FieldLabel>
                                    <Select
                                        value={selectedPreset}
                                        onValueChange={(val) => {
                                            setSelectedPreset(val);
                                            const preset = BOT_PERSONA_PRESETS.find(p => p.id === val);
                                            if (preset) setValue("botPersona", preset.prompt);
                                        }}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger id="preset" className="w-full rounded-none border-border/60 text-left bg-transparent">
                                            <SelectValue placeholder="Select preset" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-border/60">
                                            {BOT_PERSONA_PRESETS.map((preset) => (
                                                <SelectItem key={preset.id} value={preset.id}>
                                                    <div className="flex items-center gap-2">
                                                        <preset.icon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{preset.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <div className="text-xs text-muted-foreground bg-muted/30 p-3 self-end min-h-[40px] flex items-center border border-border/40">
                                    {BOT_PERSONA_PRESETS.find(p => p.id === selectedPreset)?.description}
                                </div>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="botPersona">System Instructions / Persona</FieldLabel>
                                <Textarea
                                    id="botPersona"
                                    placeholder="You are a helpful assistant..."
                                    className="rounded-none border-border/60 focus-visible:ring-ring min-h-[120px] resize-none text-sm font-mono"
                                    {...register("botPersona")}
                                    disabled={isLoading}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                                    These instructions define the core behavior and tone of your AI agent.
                                </p>
                                {errors.botPersona && <FieldError>{errors.botPersona.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <div className="mt-8 flex flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-none sm:flex-1"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-none sm:flex-1"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Chatbot..." : "Create Chatbot"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
