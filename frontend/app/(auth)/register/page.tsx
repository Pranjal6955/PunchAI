"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setStoredAccessToken } from "@/lib/api-session";


type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "", []);

  const onChange = (key: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return "All fields are required.";
    }
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = apiBase ? `${apiBase}/api/auth/signup` : "/api/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.detail || `Registration failed (${res.status}).`);
        return;
      }

      setSuccess("Registration successful. Redirecting...");

      if (data?.accessToken) {
        setStoredAccessToken(data.accessToken);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }

      setForm({ name: "", email: "", password: "", confirmPassword: "" });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch {
      setError("Network error. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-background py-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,theme(colors.indigo.500/15),transparent_45%),radial-gradient(circle_at_bottom_right,theme(colors.cyan.500/10),transparent_35%)]" />

      <div className="mx-auto grid h-full w-full max-w-none items-stretch overflow-hidden border border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:grid-cols-2">
        <section className="relative flex min-h-0 items-center overflow-hidden border-b border-border/60 bg-muted/20 p-6 lg:border-b-0 lg:border-r lg:p-10">
          <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 border border-indigo-400/20 bg-indigo-500/10 blur-2xl motion-safe:animate-pulse [animation-duration:4s]" />
          <div className="pointer-events-none absolute bottom-10 right-8 h-3 w-3 bg-cyan-400/60 motion-safe:animate-ping [animation-duration:3s]" />

          <div className="mx-auto w-full max-w-lg space-y-8">
            <div className="space-y-6">
              <div className="inline-flex w-fit border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground motion-safe:animate-pulse [animation-duration:3s]">
                Perks Studio • New Workspace
              </div>

              <div className="space-y-3 motion-safe:animate-pulse [animation-duration:5s]">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
                  Create your API lab
                  <span className="block text-muted-foreground">and start testing in minutes</span>
                </h1>
                <p className="max-w-md text-sm text-muted-foreground">
                  Set up collections, environments, and reusable requests for faster API development.
                </p>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="border-l-2 border-foreground/70 pl-3">Organize endpoints by project and version</li>
                <li className="border-l-2 border-foreground/50 pl-3">Share saved requests with your team</li>
                <li className="border-l-2 border-foreground/30 pl-3">Validate response data with less effort</li>
              </ul>

              <div className="grid grid-cols-2 border border-border text-center text-sm motion-safe:animate-pulse [animation-duration:4s]">
                <div className="border-r border-border p-4">
                  <p className="text-xl font-semibold">120+</p>
                  <p className="text-xs text-muted-foreground">Teams onboarded</p>
                </div>
                <div className="p-4">
                  <p className="text-xl font-semibold">5 min</p>
                  <p className="text-xs text-muted-foreground">Average setup time</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground">
              Start free and scale to collaborative API workflows anytime.
            </div>
          </div>
        </section>

        <section className="flex min-h-0 justify-center overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="my-auto w-full max-w-md">
            <Card className="w-full max-h-full overflow-y-auto rounded-none border-border/60 bg-background/95 shadow-none">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl tracking-tight">Register</CardTitle>
                <CardDescription>Create your Perks Studio account to start testing APIs interactively.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      className="rounded-none"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="rounded-none"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      className="rounded-none"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={(e) => onChange("password", e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="rounded-none"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={(e) => onChange("confirmPassword", e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : success ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                  ) : null}

                  <Button type="submit" className="w-full rounded-none" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-foreground hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
