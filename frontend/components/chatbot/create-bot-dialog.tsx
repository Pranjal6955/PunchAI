"use client"

import * as React from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import * as z from "zod"
import { Plus, Bot, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const engines = [
    // { id: "openai", name: "ChatGPT (OpenAI)", logo: "/brandLogo/openai.svg" },
    // { id: "anthropic", name: "Claude (Anthropic)", logo: "/brandLogo/anthropic.svg" },
    { id: "google", name: "Gemini (Google)", logo: "/brandLogo/gemini-color.svg" },
    // { id: "ollama", name: "Ollama", logo: "/brandLogo/ollama.svg" },
]

const modelsByEngine: Record<string, { id: string; name: string }[]> = {
    /*
    openai: [
        { id: "gpt-4o", name: "GPT-4o (High Intelligence)" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Fast)" },
    ],
    anthropic: [
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
        { id: "claude-3-opus", name: "Claude 3 Opus" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku" },
    ],
    */
    google: [
        // { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
    /*
    ollama: [
        { id: "llama-3-70b", name: "Llama 3 70B" },
        { id: "llama-3-8b", name: "Llama 3 8B" },
        { id: "mistral", name: "Mistral" },
    ],
    */
}

const botSchema = z.object({
    name: z.string().min(2, {
        message: "Bot name must be at least 2 characters.",
    }),
    description: z.string().optional(),
    engine: z.string().min(1, {
        message: "Please select a model engine.",
    }),
    type: z.string().min(1, {
        message: "Please select a model category.",
    }),
})

type BotFormValues = z.infer<typeof botSchema>

interface ChatBot {
    id: string
    name: string
    description: string | null
    engine: string
    type: string
}

interface CreateBotDialogProps {
    onSuccess?: () => void
    bot?: ChatBot
    trigger?: React.ReactNode
}

export function CreateBotDialog({ onSuccess, bot, trigger }: CreateBotDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const isEditing = !!bot

    const form = useForm<BotFormValues>({
        resolver: zodResolver(botSchema),
        defaultValues: {
            name: bot?.name || "",
            description: bot?.description || "",
            engine: bot?.engine || "google",
            type: bot?.type || "gemini-1.5-flash",
        },
    })

    const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = form

    const selectedEngine = watch("engine")

    // Update form when bot prop changes (for editing)
    React.useEffect(() => {
        if (bot) {
            reset({
                name: bot.name,
                description: bot.description || "",
                engine: bot.engine,
                type: bot.type,
            })
        }
    }, [bot, reset])

    // Reset type when engine changes (only if not initializing for edit)
    React.useEffect(() => {
        if (selectedEngine && modelsByEngine[selectedEngine] && !isEditing) {
            // Check if current type is already valid for this engine (to avoid reset on first edit mount)
            const isValid = modelsByEngine[selectedEngine].some(m => m.id === form.getValues("type"))
            if (!isValid) {
                setValue("type", modelsByEngine[selectedEngine][0].id)
            }
        }
    }, [selectedEngine, setValue, isEditing])

    async function onSubmit(data: BotFormValues) {
        setIsSubmitting(true)
        try {
            if (isEditing && bot) {
                await api.patch(`/bots/${bot.id}`, data)
                toast.success("Chatbot updated successfully!")
            } else {
                await api.post("/bots/", data)
                toast.success("Chatbot created successfully!")
            }
            setOpen(false)
            if (!isEditing) reset()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(error.message || `Failed to ${isEditing ? "update" : "create"} chatbot`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                        <Plus className="h-4 w-4" />
                        Create New Bot
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <Bot className="h-5 w-5 text-black dark:text-zinc-200" />
                        </div>
                        <DialogTitle className="text-xl font-bold">
                            {isEditing ? "Edit Chatbot" : "Create Chatbot"}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEditing
                            ? "Update your AI assistant's configuration and behavior instructions."
                            : "Configure your AI assistant. Choose an engine and the specific model category."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <Field>
                        <FieldLabel className="font-semibold">Bot Name</FieldLabel>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Customer Support AI"
                            className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                        <FieldError errors={[{ message: errors.name?.message }]} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel className="font-semibold">Model Engine</FieldLabel>
                            <Controller
                                control={control}
                                name="engine"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-12 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-medium">
                                            <SelectValue placeholder="Select engine" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                            {engines.map((engine) => (
                                                <SelectItem key={engine.id} value={engine.id} className="py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-5 w-5 flex items-center justify-center overflow-hidden rounded-sm">
                                                            <Image
                                                                src={engine.logo}
                                                                alt={engine.name}
                                                                fill
                                                                className={cn(
                                                                    "object-contain transition-all",
                                                                    engine.id !== "google" && "dark:invert"
                                                                )}
                                                            />
                                                        </div>
                                                        <span>{engine.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldError errors={[{ message: errors.engine?.message }]} />
                        </Field>

                        <Field>
                            <FieldLabel className="font-semibold">Model Category</FieldLabel>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-12 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-medium">
                                            <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                            {selectedEngine && modelsByEngine[selectedEngine]?.map((model) => (
                                                <SelectItem key={model.id} value={model.id} className="py-2.5">
                                                    {model.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldError errors={[{ message: errors.type?.message }]} />
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel className="font-semibold">Initial Instructions (Optional)</FieldLabel>
                        <Textarea
                            {...register("description")}
                            placeholder="e.g. You are a helpful assistant for a SaaS platform. Be polite and concise."
                            className="min-h-[100px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none"
                        />
                        <FieldError errors={[{ message: errors.description?.message }]} />
                    </Field>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                "Launch Bot"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
