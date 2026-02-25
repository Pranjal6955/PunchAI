"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isOnboarded, setIsOnboarded] = useState(false);

    // Onboarding form state
    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [chatbotTone, setChatbotTone] = useState("");
    const [languages, setLanguages] = useState<string[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const checkStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            // Check cache to avoid loading flash
            const cachedOnboarded = localStorage.getItem("isOnboarded");
            if (cachedOnboarded !== null) {
                setIsOnboarded(cachedOnboarded === "true");
                setLoading(false);
            }

            try {
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setIsOnboarded(data.isOnboarded);
                    localStorage.setItem("isOnboarded", String(data.isOnboarded));
                    if (cachedOnboarded === null) {
                        setLoading(false);
                    }
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("isOnboarded");
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error("Auth check failed", err);
                if (cachedOnboarded === null) {
                    window.location.href = "/login";
                }
            }
        };

        checkStatus();
    }, [router]);

    const handleLanguageChange = (lang: string) => {
        setLanguages(prev =>
            prev.includes(lang)
                ? prev.filter(l => l !== lang)
                : [...prev, lang]
        );
    };

    const handleOnboardingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!businessName || !industry || !websiteUrl || !chatbotTone || languages.length === 0) {
            setError("Please fill in all fields");
            return;
        }

        setSaving(true);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:5000/api/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    businessName,
                    industry,
                    websiteUrl,
                    chatbotTone,
                    languages
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to save onboarding data");
            }

            // Immediately switch view
            setIsOnboarded(true);
            localStorage.setItem("isOnboarded", "true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    if (!isOnboarded) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-8">
                <div className="w-full max-w-[500px]">
                    <Card className="border-border/50 shadow-lg">
                        <CardHeader className="text-center space-y-2">
                            <CardTitle className="text-2xl font-bold">Welcome to PunchAI</CardTitle>
                            <CardDescription>
                                Let's set up your workspace so we can tailor the experience to your needs.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleOnboardingSubmit}>
                            <CardContent className="space-y-6">
                                {error && (
                                    <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center border border-destructive/20">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <Label htmlFor="businessName" className="text-sm font-medium">1. Business Name</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="Acme Corp"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-medium">2. Industry</Label>
                                    <Select value={industry} onValueChange={setIndustry}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select your industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                                            <SelectItem value="SaaS">SaaS</SelectItem>
                                            <SelectItem value="Education">Education</SelectItem>
                                            <SelectItem value="Finance">Finance</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="websiteUrl" className="text-sm font-medium">3. Website URL</Label>
                                    <Input
                                        id="websiteUrl"
                                        placeholder="https://acmecorp.com"
                                        type="url"
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-sm font-medium">4. Chatbot Tone</Label>
                                    <Select value={chatbotTone} onValueChange={setChatbotTone}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select tone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Friendly">Friendly</SelectItem>
                                            <SelectItem value="Professional">Professional</SelectItem>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">5. Languages (Select all that apply)</Label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                                checked={languages.includes("English")}
                                                onChange={() => handleLanguageChange("English")}
                                            />
                                            <span className="text-sm">English</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                                checked={languages.includes("Hindi")}
                                                onChange={() => handleLanguageChange("Hindi")}
                                            />
                                            <span className="text-sm">Hindi</span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={saving} className="w-full h-11 font-medium text-base">
                                    {saving ? "Saving..." : "Complete Setup"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">You are viewing the protected dashboard space.</p>
        </div>
    );
}
