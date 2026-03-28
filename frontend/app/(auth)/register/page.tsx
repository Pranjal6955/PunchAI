"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowRight, Eye, EyeOff, Loader2, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const registerSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(data: RegisterValues) {
        setIsLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: data.email,
                    fullName: data.fullName,
                    password: data.password,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || "Registration failed")
            }

            // Save user info and token to localStorage
            localStorage.setItem("punch_token", result.token)
            localStorage.setItem("punch_user", JSON.stringify({
                _id: result._id,
                email: result.email,
                fullName: result.fullName
            }))

            toast.success("Account created successfully!")
            router.push("/dashboard")
        } catch (error: any) {
            toast.error(error.message || "An error occurred during registration.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Decorative Glow */}
            <div className="absolute top-0 -z-10 h-[400px] w-full bg-gradient-to-b from-primary/5 to-transparent blur-3xl" />

            <main className="relative z-10 w-full max-w-[400px] px-6">
                <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <Link href="/" className="transition-transform duration-300 hover:scale-110">
                            <Image
                                src="/Logo_dark_theme.png"
                                alt="Punch AI"
                                width={48}
                                height={48}
                            // className="dark:invert grayscale brightness-0 dark:brightness-200"
                            />
                        </Link>
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
                            <p className="text-sm text-muted-foreground">Start turning Company Website into conversations</p>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className={cn(
                        "w-full rounded-2xl border bg-card p-1 shadow-2xl transition-all duration-500",
                        "border-neutral-200 dark:border-neutral-800",
                        "shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)]"
                    )}>
                        <div className="flex flex-col space-y-6 p-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-10 border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                                onClick={() => {
                                    toast.info("Google authentication is currently being integrated.")
                                }}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.28.81-.56z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-neutral-100 dark:border-neutral-900" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-card px-2 text-muted-foreground/60 tracking-widest font-medium">Or continue with email</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <Field>
                                    <FieldLabel className="text-xs font-medium text-muted-foreground/80">Full Name</FieldLabel>
                                    <Input
                                        {...register("fullName")}
                                        placeholder="Enter your full name"
                                        className={cn(
                                            "h-10 border-neutral-200 bg-neutral-50/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
                                            "dark:border-neutral-800 dark:bg-neutral-900/50 transition-all duration-300"
                                        )}
                                        autoComplete="name"
                                        disabled={isLoading}
                                    />
                                    <FieldError errors={[{ message: errors.fullName?.message }]} />
                                </Field>

                                <Field>
                                    <FieldLabel className="text-xs font-medium text-muted-foreground/80 ">Email Address</FieldLabel>
                                    <Input
                                        {...register("email")}
                                        type="email"
                                        placeholder="Enter your email address"
                                        className={cn(
                                            "h-10 border-neutral-200 bg-neutral-50/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
                                            "dark:border-neutral-800 dark:bg-neutral-900/50 transition-all duration-300"
                                        )}
                                        autoComplete="email"
                                        disabled={isLoading}
                                    />
                                    <FieldError errors={[{ message: errors.email?.message }]} />
                                </Field>

                                <Field>
                                    <div className="flex items-center justify-between">
                                        <FieldLabel className="text-xs font-medium text-muted-foreground/80 ">Password</FieldLabel>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <Input
                                        {...register("password")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={cn(
                                            "h-10 border-neutral-200 bg-neutral-50/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
                                            "dark:border-neutral-800 dark:bg-neutral-900/50 transition-all duration-300"
                                        )}
                                        autoComplete="new-password"
                                        disabled={isLoading}
                                    />
                                    <FieldError errors={[{ message: errors.password?.message }]} />
                                </Field>

                                <Field>
                                    <FieldLabel className="text-xs font-medium text-muted-foreground/80 ">Confirm Password</FieldLabel>
                                    <Input
                                        {...register("confirmPassword")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={cn(
                                            "h-10 border-neutral-200 bg-neutral-50/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary",
                                            "dark:border-neutral-800 dark:bg-neutral-900/50 transition-all duration-300"
                                        )}
                                        autoComplete="new-password"
                                        disabled={isLoading}
                                    />
                                    <FieldError errors={[{ message: errors.confirmPassword?.message }]} />
                                </Field>

                                <Button
                                    type="submit"
                                    className={cn(
                                        "w-full h-10 group relative overflow-hidden transition-all active:scale-95 duration-200",
                                        "bg-primary text-primary-foreground hover:bg-primary/90",
                                        !isValid && "opacity-50 grayscale cursor-not-allowed"
                                    )}
                                    disabled={isLoading}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </div>
                                </Button>
                            </form>

                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/login" className="text-primary hover:underline font-medium underline-offset-4">
                                        Log in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed max-w-[280px]">
                        By continuing, you agree to Punch AI's Terms of Service and Privacy Policy. All bots include a 14-day free trial.
                    </p>
                </div>
            </main>

            {/* Background Micro-details */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[300px] w-full -translate-x-1/2 bg-[radial-gradient(circle_farthest-side_at_50%_100%,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(circle_farthest-side_at_50%_100%,rgba(255,255,255,0.03),transparent)]" />
        </div>
    )
}
