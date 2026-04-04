"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createProject } from "@/lib/api-session"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"

const API_TYPE_LOGOS: Record<string, string> = {
    "Node.js": "/nodejs_2.svg",
    "Python": "/python_4.svg",
    "Go": "/Go_Logo_Blue.svg.png",
    "PHP": "/php_4.svg",
    "Ruby": "/ruby_4.svg",
    "Java": "/java_5.svg",
};

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Project name must be at least 2 characters.",
    }),
    description: z.string().optional(),
    apiType: z.string().min(1, {
        message: "Please select an API type.",
    }),
})

interface CreateProjectDialogProps {
    onSuccess?: () => void | Promise<void>;
    trigger?: React.ReactNode;
}

export function CreateProjectDialog({ onSuccess, trigger }: CreateProjectDialogProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            apiType: "Node.js",
        },
    })

    // Watch for Select value updates
    const apiType = watch("apiType")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await createProject(values);
            if (result) {
                toast.success("Project created successfully!");
                setOpen(false);
                reset();
                if (onSuccess) {
                    await onSuccess();
                } else {
                    router.refresh();
                }
            } else {
                toast.error("Failed to create project");
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
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-none border border-border/60 bg-background/95 p-0 overflow-hidden">
                <div className="p-6 space-y-6">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl font-semibold tracking-tight">Create New Project</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Define your project workspace and select the API environment to get started.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Project Name</FieldLabel>
                                <Input
                                    id="name"
                                    placeholder="e.g. E-commerce API"
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
                                    placeholder="Briefly describe the purpose of this project..."
                                    className="rounded-none border-border/60 focus-visible:ring-ring min-h-[100px] resize-none"
                                    {...register("description")}
                                    disabled={isLoading}
                                />
                                {errors.description && <FieldError>{errors.description.message}</FieldError>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="apiType">API Environment</FieldLabel>
                                <Select
                                    value={apiType}
                                    onValueChange={(val) => setValue("apiType", val)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="apiType" className="w-full rounded-none border-border/60 text-left bg-transparent">
                                        <SelectValue placeholder="Select environment" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-border/60">
                                        {Object.entries(API_TYPE_LOGOS).map(([name, logo]) => (
                                            <SelectItem key={name} value={name}>
                                                <div className="flex items-center gap-2">
                                                    <img src={logo} alt="" className="h-4 w-auto object-contain" />
                                                    <span>{name === "Node.js" ? "Node.js (Next.js, Express)" :
                                                        name === "Python" ? "Python (FastAPI, Django)" :
                                                            name === "Go" ? "Go (Gin, Echo)" :
                                                                name === "PHP" ? "PHP (Laravel, Symfony)" :
                                                                    name === "Ruby" ? "Ruby (Rails)" :
                                                                        name === "Java" ? "Java (Spring Boot)" : name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={[errors.apiType]} />
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
                                {isLoading ? "Creating Project..." : "Create Project"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
