"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { BotMessageSquare, Eye, EyeOff } from "lucide-react";
import TextType from "@/components/TextType";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import Link from "next/link";
import { login } from "@/lib/api-session";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [chatStep, setChatStep] = React.useState(0);

  React.useEffect(() => {
    const t1 = setTimeout(() => setChatStep(1), 500);
    const t2 = setTimeout(() => setChatStep(2), 3500);
    const t3 = setTimeout(() => setChatStep(3), 8500);
    const t4 = setTimeout(() => setChatStep(4), 13000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await login(values);

      toast.success("Login successful! Redirecting...");

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

        {/* Chatbot Visualization block */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center p-6">
          {/* Floating Info Cards */}
          <div className="absolute top-12 right-12 flex flex-col gap-4 opacity-80">
            <div className="flex items-center gap-2.5 rounded-none border border-zinc-700/50 bg-zinc-800/80 px-4 py-2.5 text-xs text-white shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium tracking-wide">AI Agent</span>
            </div>
          </div>

          <div className="w-full max-w-lg space-y-5 opacity-70">
            {/* User Message */}
            {chatStep >= 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-end pl-12 duration-700">
                <span className="mr-1 mb-1.5 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                  You
                </span>
                <div className="bg-primary/20 border-primary/30 rounded-none border px-4 py-3 text-sm text-white shadow-sm backdrop-blur-md">
                  <TextType
                    text="Hey PunchAI, can you help me draft a response to an unhappy customer?"
                    loop={false}
                  />
                </div>
              </div>
            )}
            {/* Bot Message */}
            {chatStep >= 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-start pr-12 duration-700">
                <span className="mb-1.5 ml-[36px] text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                  AI Agent
                </span>
                <div className="flex items-start gap-3 rounded-none border border-zinc-700/50 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-300 shadow-sm backdrop-blur-md">
                  <div className="mt-0.5 shrink-0">
                    <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-none shadow-sm">
                      <BotMessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <TextType
                    text="Of course! Let me know what they are upset about and any specific resolution you'd like to offer."
                    loop={false}
                    as="p"
                  />
                </div>
              </div>
            )}
            {/* User Message */}
            {chatStep >= 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 mt-2 flex flex-col items-end pl-12 duration-700">
                <span className="mr-1 mb-1.5 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                  You
                </span>
                <div className="bg-primary/20 border-primary/30 rounded-none border px-4 py-3 text-sm text-white shadow-sm backdrop-blur-md">
                  <TextType
                    text="They received a broken item. Let's send an apology and an immediate free replacement."
                    loop={false}
                  />
                </div>
              </div>
            )}
            {/* Bot Message */}
            {chatStep >= 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-start pr-12 duration-700">
                <span className="mb-1.5 ml-[36px] text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                  AI Agent
                </span>
                <div className="flex w-full items-start gap-3 rounded-none border border-zinc-700/50 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-300 shadow-sm backdrop-blur-md">
                  <div className="mt-0.5 shrink-0">
                    <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-none shadow-sm">
                      <BotMessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <p className="flex items-center gap-2">
                      Drafting your perfect response{" "}
                      <span className="flex gap-0.5">
                        <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400"></span>
                        <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 delay-75"></span>
                        <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 delay-150"></span>
                      </span>
                    </p>
                    <div className="relative mt-1 mb-1 h-1 w-full overflow-hidden rounded-none bg-zinc-700">
                      <div className="absolute top-0 left-0 h-full w-[75%] animate-pulse bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"></span>{" "}
                        Drafting: 42ms
                      </span>
                      <span>Tokens: 120/s</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              &ldquo;PunchAI has revolutionized how we manage our chatbot pipelines. The intuitive
              dashboard and powerful inference capabilities are unmatched.&rdquo;
            </p>
            <footer className="text-sm font-medium text-zinc-400">
              Sofia Davis, Lead AI Engineer
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
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and password to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-primary text-xs font-semibold underline-offset-4 transition-colors hover:underline"
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
            <Button
              type="submit"
              className="mt-4 h-9 w-full rounded-none text-sm font-semibold transition-all"
              disabled={isLoading}
            >
              {isLoading && (
                <HugeiconsIcon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign In
            </Button>
          </form>

          <div className="text-muted-foreground group pt-1 text-center text-sm md:text-left">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Sign up
              <span
                aria-hidden="true"
                className="ml-1 inline-block translate-x-0 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          <p className="text-muted-foreground mx-auto max-w-[90%] pt-1 text-center text-xs md:mx-0 md:text-left">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="hover:text-primary underline underline-offset-4 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="hover:text-primary underline underline-offset-4 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
