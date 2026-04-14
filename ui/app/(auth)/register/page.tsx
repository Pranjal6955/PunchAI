"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { BotMessageSquare, Eye, EyeOff } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { signup } from "@/lib/api-session";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = form;
  const termsAccepted = watch("termsAccepted");

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const {
        confirmPassword: _confirmPassword,
        termsAccepted: _termsAccepted,
        ...submitValues
      } = values;

      await signup(submitValues);

      toast.success("Account created successfully! Redirecting...");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-background grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      {/* Left / Branding Side */}
      <div className="border-border/10 relative hidden flex-col justify-between overflow-hidden border-r bg-zinc-950 p-10 text-white md:flex">
        {/* Abstract CSS Layout & Glowing Elements */}
        <div className="absolute inset-0 z-0 bg-zinc-950" />
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="bg-primary/20 absolute top-0 right-0 left-0 -z-0 m-auto h-[310px] w-[310px] rounded-full opacity-30 blur-[100px]" />
        <div className="bg-primary/10 absolute right-[-10%] bottom-0 -z-0 h-[250px] w-[250px] rounded-full opacity-30 blur-[100px]" />

        {/* Developer Settings Mockup block */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center p-6">
          <div className="mt-12 w-full max-w-lg rounded-none border border-zinc-700/50 bg-zinc-950/90 p-6 opacity-85 shadow-2xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-tight tracking-widest text-zinc-100 uppercase">
                Developer API Integration
              </h3>
              <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium tracking-wider text-emerald-400 uppercase">
                Live Mode
              </span>
            </div>

            <div className="space-y-5">
              {/* Endpoint */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                  <div className="h-1.5 w-1.5 rounded-none bg-blue-500"></div>
                  POST Endpoint
                </label>
                <div className="flex w-full items-center justify-between border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-zinc-300">
                  <span>https://api.punchstudio.ai/v1/chat</span>
                  <BotMessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                  <div className="h-1.5 w-1.5 rounded-none bg-amber-500"></div>
                  Secret Key
                </label>
                <div className="group flex w-full items-center justify-between border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-emerald-400/90">
                  <span className="tracking-widest">
                    sk_live_• • • • • • • • • • • • • • • • Q7vX
                  </span>
                </div>
              </div>

              {/* cURL Example */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                  <div className="h-1.5 w-1.5 rounded-none bg-rose-500"></div>
                  cURL Example
                </label>
                <div className="relative w-full border border-zinc-800 bg-zinc-900 p-4 font-mono text-[10px] leading-relaxed text-zinc-300">
                  <div className="text-blue-400">
                    curl <span className="text-zinc-300">-X POST \</span>
                  </div>
                  <div className="pl-4 text-emerald-300">
                    https://api.punchstudio.ai/v1/chat <span className="text-zinc-300">\</span>
                  </div>
                  <div className="pl-4 text-zinc-400">
                    -H{" "}
                    <span className="text-amber-300">
                      &quot;Authorization: Bearer sk_live_...&quot;
                    </span>{" "}
                    <span className="text-zinc-300">\</span>
                  </div>
                  <div className="pl-4 text-zinc-400">
                    -H{" "}
                    <span className="text-amber-300">
                      &quot;Content-Type: application/json&quot;
                    </span>{" "}
                    <span className="text-zinc-300">\</span>
                  </div>
                  <div className="pl-4">
                    {"-d '{"} <span className="text-amber-300">&quot;message&quot;</span>:{" "}
                    <span className="text-amber-300">&quot;Hello&quot;</span> {"}'"}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                    Connection Verified
                  </span>
                </div>
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
                  Last called: Just now
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Image
            src="/Logo_dark_theme.png"
            alt="PunchAI"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-lg leading-relaxed font-medium">
              &ldquo;Integrating an intelligent conversational layer into our platform was
              effortless with PunchAI. It&apos;s the ultimate accelerator for modern AI-driven
              product teams.&rdquo;
            </p>
            <footer className="text-sm font-medium text-zinc-400">
              Marcus Wright, VP of Product
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right / Form Side */}
      <div className="bg-background relative flex flex-col items-center justify-center p-8">
        {/* Mobile branding */}
        <div className="mb-10 flex items-center gap-2 md:hidden">
          <Image
            src="/Logo_dark_theme.png"
            alt="PunchAI"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="w-full max-w-[380px] space-y-5">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
            <p className="text-muted-foreground text-sm">Enter your details below to get started</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field className="space-y-1">
              <Label htmlFor="name" className="font-semibold">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...register("name")}
                disabled={isLoading}
                className="focus-visible:ring-primary/20 bg-background h-9 rounded-none px-3 transition-colors focus-visible:ring-2"
              />
              <FieldError errors={errors.name ? [errors.name] : undefined} />
            </Field>
            <Field className="space-y-1">
              <Label htmlFor="email" className="font-semibold">
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email"
                {...register("email")}
                disabled={isLoading}
                className="focus-visible:ring-primary/20 bg-background h-9 rounded-none px-3 transition-colors focus-visible:ring-2"
              />
              <FieldError errors={errors.email ? [errors.email] : undefined} />
            </Field>
            <Field className="space-y-1">
              <Label htmlFor="password" className="font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="focus-visible:ring-primary/20 bg-background h-9 rounded-none px-3 pr-10 transition-colors focus-visible:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={errors.password ? [errors.password] : undefined} />
            </Field>
            <Field className="space-y-1">
              <Label htmlFor="confirmPassword" className="font-semibold">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                  className="focus-visible:ring-primary/20 bg-background h-9 rounded-none px-3 pr-10 transition-colors focus-visible:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
            </Field>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="termsAccepted"
                checked={termsAccepted as boolean}
                onCheckedChange={(checked) =>
                  setValue("termsAccepted", checked === true, { shouldValidate: true })
                }
                className="mt-1"
              />
              <Label
                htmlFor="termsAccepted"
                className="text-muted-foreground mt-1 cursor-pointer text-[13px] leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept the{" "}
                <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
                  Terms
                </Link>{" "}
                &amp;{" "}
                <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {errors.termsAccepted && (
              <p className="text-destructive mt-0.5 text-[10px] font-medium">
                {errors.termsAccepted.message as string}
              </p>
            )}

            <Button
              type="submit"
              className="mt-4 h-9 w-full rounded-none text-sm font-semibold transition-all"
              disabled={isLoading || !isValid || !termsAccepted}
            >
              {isLoading && (
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>

          <div className="text-muted-foreground group pt-1 text-center text-sm md:text-left">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Sign in
              <span
                aria-hidden="true"
                className="ml-1 inline-block translate-x-0 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
