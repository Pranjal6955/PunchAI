"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { BotMessageSquare, Eye, EyeOff } from "lucide-react"
import TextType from "@/components/TextType"


import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"


import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Field, FieldError } from "@/components/ui/field"
import Link from "next/link"
import { login } from "@/lib/api-session"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters")
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [chatStep, setChatStep] = React.useState(0)

    React.useEffect(() => {
        const t1 = setTimeout(() => setChatStep(1), 500)
        const t2 = setTimeout(() => setChatStep(2), 3500)
        const t3 = setTimeout(() => setChatStep(3), 8500)
        const t4 = setTimeout(() => setChatStep(4), 13000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [])

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const { register, handleSubmit, formState: { errors } } = form

    async function onSubmit(values: LoginFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            await login(values);

            toast.success("Login successful! Redirecting...")

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (err: any) {
            const message = err.message || "Something went wrong"
            setError(message)
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
            {/* Left / Branding Side */}
            <div className="relative hidden md:flex flex-col justify-between bg-zinc-950 text-white p-10 overflow-hidden border-r border-border/10">
                {/* Abstract CSS Layout & Glowing Elements */}
                <div className="absolute inset-0 bg-zinc-950 z-0" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
                <div className="absolute left-0 right-0 top-0 -z-0 m-auto h-[310px] w-[310px] bg-primary/20 opacity-30 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-[-10%] -z-0 h-[250px] w-[250px] bg-primary/10 opacity-30 blur-[100px] rounded-full" />

                {/* Chatbot Visualization block */}
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-0">

                    {/* Floating Info Cards */}
                    <div className="absolute top-12 right-12 flex flex-col gap-4 opacity-80">
                        <div className="bg-zinc-800/80 text-white text-xs px-4 py-2.5 rounded-none border border-zinc-700/50 backdrop-blur-md shadow-sm flex items-center gap-2.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="font-medium tracking-wide">AI Agent</span>
                        </div>

                    </div>

                    <div className="w-full max-w-lg space-y-5 opacity-70">
                        {/* User Message */}
                        {chatStep >= 1 && (
                            <div className="flex flex-col items-end pl-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] text-zinc-400 font-medium mb-1.5 mr-1 uppercase tracking-wider">You</span>
                                <div className="bg-primary/20 text-white text-sm py-3 px-4 rounded-none border border-primary/30 shadow-sm backdrop-blur-md">
                                    <TextType text="Hey Punch Studio, can you help me draft a response to an unhappy customer?" loop={false} />
                                </div>
                            </div>
                        )}
                        {/* Bot Message */}
                        {chatStep >= 2 && (
                            <div className="flex flex-col items-start pr-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] text-zinc-400 font-medium mb-1.5 ml-[36px] uppercase tracking-wider">AI Agent</span>
                                <div className="bg-zinc-800/80 text-zinc-300 text-sm py-3 px-4 rounded-none border border-zinc-700/50 flex items-start gap-3 backdrop-blur-md shadow-sm">
                                    <div className="mt-0.5 shrink-0">
                                        <div className="flex h-6 w-6 items-center justify-center bg-primary rounded-none text-primary-foreground shadow-sm">
                                            <BotMessageSquare className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <TextType text="Of course! Let me know what they are upset about and any specific resolution you'd like to offer." loop={false} as="p" />
                                </div>
                            </div>
                        )}
                        {/* User Message */}
                        {chatStep >= 3 && (
                            <div className="flex flex-col items-end pl-12 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] text-zinc-400 font-medium mb-1.5 mr-1 uppercase tracking-wider">You</span>
                                <div className="bg-primary/20 text-white text-sm py-3 px-4 rounded-none border border-primary/30 shadow-sm backdrop-blur-md">
                                    <TextType text="They received a broken item. Let's send an apology and an immediate free replacement." loop={false} />
                                </div>
                            </div>
                        )}
                        {/* Bot Message */}
                        {chatStep >= 4 && (
                            <div className="flex flex-col items-start pr-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="text-[10px] text-zinc-400 font-medium mb-1.5 ml-[36px] uppercase tracking-wider">AI Agent</span>
                                <div className="bg-zinc-800/80 text-zinc-300 text-sm py-3 px-4 rounded-none border border-zinc-700/50 flex items-start gap-3 backdrop-blur-md shadow-sm w-full">
                                    <div className="mt-0.5 shrink-0">
                                        <div className="flex h-6 w-6 items-center justify-center bg-primary rounded-none text-primary-foreground shadow-sm">
                                            <BotMessageSquare className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 w-full">
                                        <p className="flex items-center gap-2">Drafting your perfect response <span className="flex gap-0.5"><span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce"></span><span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce delay-75"></span><span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce delay-150"></span></span></p>
                                        <div className="h-1 w-full bg-zinc-700 rounded-none overflow-hidden mt-1 mb-1 relative">
                                            <div className="absolute top-0 left-0 h-full bg-emerald-500 w-[75%] animate-pulse" />
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-zinc-400 pt-1">
                                            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block animate-pulse"></span> Drafting: 42ms</span>
                                            <span>Tokens: 120/s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <img src="/Logo_dark_theme.png" alt="Punch Studio" className="h-10 w-auto object-contain" />
                </div>

                <div className="relative z-10 mt-auto">
                    <blockquote className="space-y-4">
                        <p className="text-lg font-medium leading-relaxed">
                            &ldquo;Punch Studio has revolutionized how we manage our chatbot pipelines. The intuitive dashboard and powerful inference capabilities are unmatched.&rdquo;
                        </p>
                        <footer className="text-sm font-medium text-zinc-400">Sofia Davis, Lead AI Engineer</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right / Form Side */}
            <div className="flex flex-col items-center justify-center p-8 bg-background relative">
                {/* Mobile branding */}
                <div className="md:hidden flex items-center gap-2 mb-10">
                    <img src="/Logo_dark_theme.png" alt="Punch Studio" className="h-10 w-auto object-contain" />
                </div>

                <div className="w-full max-w-[380px] space-y-5">
                    <div className="space-y-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email and password to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="rounded-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Field className="space-y-1">
                            <Label htmlFor="email" className="font-semibold">Work Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your work email"
                                {...register("email")}
                                disabled={isLoading}
                                className="h-9 px-3 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 bg-background rounded-none"
                            />
                            <FieldError errors={errors.email ? [errors.email] : undefined} />
                        </Field>
                        <Field className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="font-semibold">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-primary underline-offset-4 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password")}
                                    disabled={isLoading}
                                    className="h-9 px-3 pr-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 bg-background rounded-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldError errors={errors.password ? [errors.password] : undefined} />
                        </Field>
                        <Button
                            type="submit"
                            className="w-full h-9 mt-4 font-semibold text-sm transition-all rounded-none"
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In
                        </Button>
                    </form>

                    <div className="text-center md:text-left text-sm text-muted-foreground group pt-1">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            Sign up
                            <span aria-hidden="true" className="ml-1 inline-block translate-x-0 transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>

                    <p className="text-center md:text-left text-xs text-muted-foreground max-w-[90%] mx-auto md:mx-0 pt-1">
                        By signing in, you agree to our{" "}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
