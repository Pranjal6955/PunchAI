"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { BotMessageSquare, Eye, EyeOff } from "lucide-react"


import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"


import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Field, FieldError } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { signup } from "@/lib/api-session"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    termsAccepted: z.boolean().refine((val) => val === true, { message: "You must accept the terms" })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            termsAccepted: false,
        },
    })

    const { register, handleSubmit, formState: { errors, isValid }, setValue, watch } = form
    const termsAccepted = watch("termsAccepted")

    async function onSubmit(values: RegisterFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const { confirmPassword, termsAccepted, ...submitValues } = values;

            await signup(submitValues);

            toast.success("Account created successfully! Redirecting...")

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

                {/* Developer Settings Mockup block */}
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none z-0">
                    <div className="bg-zinc-950/90 border border-zinc-700/50 w-full max-w-lg shadow-2xl backdrop-blur-md opacity-85 mt-12 rounded-none p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-zinc-100 font-semibold tracking-tight tracking-widest uppercase text-xs">Developer API Integration</h3>
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 uppercase tracking-wider font-medium">Live Mode</span>
                        </div>

                        <div className="space-y-5">
                            {/* Endpoint */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex gap-2 items-center">
                                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-none"></div>
                                    POST Endpoint
                                </label>
                                <div className="w-full bg-zinc-900 border border-zinc-800 p-3 text-xs font-mono text-zinc-300 flex justify-between items-center">
                                    <span>https://api.punchstudio.ai/v1/chat</span>
                                    <BotMessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                                </div>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex gap-2 items-center">
                                    <div className="h-1.5 w-1.5 bg-amber-500 rounded-none"></div>
                                    Secret Key
                                </label>
                                <div className="w-full bg-zinc-900 border border-zinc-800 p-3 text-xs font-mono text-emerald-400/90 flex justify-between items-center group">
                                    <span className="tracking-widest">sk_live_• • • • • • • • • • • • • • • • Q7vX</span>
                                </div>
                            </div>

                            {/* cURL Example */}
                            <div className="pt-2 space-y-2">
                                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex gap-2 items-center">
                                    <div className="h-1.5 w-1.5 bg-rose-500 rounded-none"></div>
                                    cURL Example
                                </label>
                                <div className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] leading-relaxed font-mono text-zinc-300 relative">
                                    <div className="text-blue-400">curl <span className="text-zinc-300">-X POST \</span></div>
                                    <div className="text-emerald-300 pl-4">https://api.punchstudio.ai/v1/chat <span className="text-zinc-300">\</span></div>
                                    <div className="pl-4 text-zinc-400">-H <span className="text-amber-300">"Authorization: Bearer sk_live_..."</span> <span className="text-zinc-300">\</span></div>
                                    <div className="pl-4 text-zinc-400">-H <span className="text-amber-300">"Content-Type: application/json"</span> <span className="text-zinc-300">\</span></div>
                                    <div className="pl-4">{"-d '{"} <span className="text-amber-300">"message"</span>: <span className="text-amber-300">"Hello"</span> {"}'"}</div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="pt-4 flex items-center justify-between border-t border-zinc-800/80 mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Connection Verified</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Last called: Just now</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <img src="/Logo_dark_theme.png" alt="Punch Studio" className="h-10 w-auto object-contain" />
                </div>

                <div className="relative z-10 mt-auto">
                    <blockquote className="space-y-4">
                        <p className="text-lg font-medium leading-relaxed">
                            &ldquo;Integrating an intelligent conversational layer into our platform was effortless with Punch Studio. It&apos;s the ultimate accelerator for modern AI-driven product teams.&rdquo;
                        </p>
                        <footer className="text-sm font-medium text-zinc-400">Marcus Wright, VP of Product</footer>
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
                        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your details below to get started
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
                            <Label htmlFor="name" className="font-semibold">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                {...register("name")}
                                disabled={isLoading}
                                className="h-9 px-3 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 bg-background rounded-none"
                            />
                            <FieldError errors={errors.name ? [errors.name] : undefined} />
                        </Field>
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
                            <Label htmlFor="password" className="font-semibold">Password</Label>
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
                        <Field className="space-y-1">
                            <Label htmlFor="confirmPassword" className="font-semibold">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                    disabled={isLoading}
                                    className="h-9 px-3 pr-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 bg-background rounded-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
                        </Field>

                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox
                                id="termsAccepted"
                                checked={termsAccepted as boolean}
                                onCheckedChange={(checked) => setValue("termsAccepted", checked === true, { shouldValidate: true })}
                                className="mt-1"
                            />
                            <Label
                                htmlFor="termsAccepted"
                                className="text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer mt-1"
                            >
                                I accept the <Link href="/terms" className="text-primary hover:underline underline-offset-2">Terms</Link> &amp; <Link href="/privacy" className="text-primary hover:underline underline-offset-2">Privacy Policy</Link>.
                            </Label>
                        </div>
                        {errors.termsAccepted && <p className="text-[10px] font-medium text-destructive mt-0.5">{errors.termsAccepted.message as string}</p>}

                        <Button
                            type="submit"
                            className="w-full h-9 mt-4 font-semibold text-sm transition-all rounded-none"
                            disabled={isLoading || !isValid || !termsAccepted}
                        >
                            {isLoading && (
                                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Account
                        </Button>
                    </form>

                    <div className="text-center md:text-left text-sm text-muted-foreground group pt-1">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            Sign in
                            <span aria-hidden="true" className="ml-1 inline-block translate-x-0 transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
