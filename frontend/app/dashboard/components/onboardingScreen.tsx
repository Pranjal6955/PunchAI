"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X } from "lucide-react";

interface OnboardingScreenProps {
    onDismiss?: () => void;
}

export default function OnboardingScreen({ onDismiss }: OnboardingScreenProps) {
    const [step, setStep] = useState(1);
    const [user, setUser] = useState<{ isOnboarded?: boolean } | null>(null);
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        websiteUrl: "",
        chatbotPurpose: [] as string[],
        chatbotPersonality: "",
        supportedLanguages: [] as string[],
        knowledgeBaseSetup: "",
    });

    const saveToDatabase = useCallback(async (currentData: typeof formData, stepToSave: number, isFinal: boolean = false) => {
        try {
            const token = localStorage.getItem("token");
            await fetch("http://localhost:5000/api/onboarding", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...currentData,
                    onboardingStep: stepToSave,
                    isOnboarded: isFinal ? true : (user?.isOnboarded || false)
                }),
            });
            window.dispatchEvent(new Event("onboarding_update"));
        } catch (error) {
            console.error("Failed to sync onboarding to database", error);
        }
    }, [user?.isOnboarded]);

    // Load saved data on mount
    useEffect(() => {
        const savedStep = localStorage.getItem("onboarding_step");
        if (savedStep) setStep(parseInt(savedStep));

        // Fetch user data including potential partial onboarding from DB
        const fetchExistingData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const userData = data.user || data;
                    setUser(userData);

                    // Set current step from DB if it's further than local storage or if local is default
                    if (userData.onboardingStep && (!localStorage.getItem("onboarding_step") || userData.onboardingStep > 1)) {
                        setStep(userData.onboardingStep);
                    }

                    // Prioritize DB data if local storage is empty
                    if (!localStorage.getItem("onboarding_form_data")) {
                        setFormData({
                            companyName: userData.companyName || "",
                            industry: userData.industry || "",
                            websiteUrl: userData.websiteUrl || "",
                            chatbotPurpose: userData.chatbotPurpose || [],
                            chatbotPersonality: userData.chatbotPersonality || "",
                            supportedLanguages: userData.supportedLanguages || [],
                            knowledgeBaseSetup: userData.knowledgeBaseSetup || "",
                        });
                    }
                }
            } catch { }
        };

        fetchExistingData();

        const savedData = localStorage.getItem("onboarding_form_data");
        if (savedData) {
            try {
                setFormData(JSON.parse(savedData));
            } catch {
                console.error("Failed to parse saved onboarding data");
            }
        }
    }, []);

    // Persist current step to localStorage and DB
    useEffect(() => {
        localStorage.setItem("onboarding_step", step.toString());
        window.dispatchEvent(new Event("onboarding_update"));
        if (step > 1) {
            saveToDatabase(formData, step);
        }
    }, [step, formData, saveToDatabase]);

    // Persist form data to localStorage and periodically sync to DB
    useEffect(() => {
        localStorage.setItem("onboarding_form_data", JSON.stringify(formData));

        const timeoutId = setTimeout(() => {
            if (formData.companyName || formData.industry) { // Only sync if some data entered
                saveToDatabase(formData, step);
            }
        }, 2000); // 2 second debounce for DB sync

        return () => clearTimeout(timeoutId);
    }, [formData, step, saveToDatabase]);

    const [loading, setLoading] = useState(false);
    const [otherLanguage, setOtherLanguage] = useState("");

    const handleNext = async () => {
        setStep((prev) => prev + 1);
    };

    const handlePrev = () => setStep((prev) => prev - 1);

    const handleCheckboxChange = (field: "chatbotPurpose" | "supportedLanguages", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
        }));
    };

    const handleAddOtherLanguage = () => {
        const trimmed = otherLanguage.trim();
        if (trimmed && !formData.supportedLanguages.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                supportedLanguages: [...prev.supportedLanguages, trimmed]
            }));
            setOtherLanguage("");
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Final save with isOnboarded = true
            await saveToDatabase(formData, step, true);

            // Fetch updated user to update local storage
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("user", JSON.stringify(data.user || data));
                localStorage.removeItem("onboarding_skipped");
                localStorage.removeItem("onboarding_step");
                localStorage.removeItem("onboarding_form_data");
                window.location.reload(); // Refresh to hide onboarding and show dashboard
            }
        } catch (error) {
            console.error("Error saving onboarding data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-md p-8 space-y-8 bg-card border border-border rounded-2xl shadow-2xl relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                    onClick={onDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-primary/5 rounded-2xl ring-1 ring-primary/10">
                            <Image src="/Logo_dark_theme.png" alt="PunchAI Logo" width={48} height={48} className="object-contain" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome to PunchAI
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Let&apos;s set up your chatbot.
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName" className="text-foreground">What is your business name?</Label>
                            <Input
                                id="companyName"
                                placeholder="e.g. Acme Corp"
                                value={formData.companyName}
                                className="bg-background border-input text-foreground"
                                onChange={(e) =>
                                    setFormData({ ...formData, companyName: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry" className="text-foreground">What industry are you in?</Label>
                            <Select
                                value={formData.industry}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, industry: value })
                                }
                            >
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                                    <SelectItem value="SaaS / Tech">SaaS / Tech</SelectItem>
                                    <SelectItem value="Education">Education</SelectItem>
                                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    <SelectItem value="Finance">Finance</SelectItem>
                                    <SelectItem value="Travel">Travel</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl" className="text-foreground">What is your website URL?</Label>
                            <Input
                                id="websiteUrl"
                                placeholder="https://example.com"
                                value={formData.websiteUrl}
                                className="bg-background border-input text-foreground"
                                onChange={(e) =>
                                    setFormData({ ...formData, websiteUrl: e.target.value })
                                }
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <Label className="text-foreground">What should your chatbot help users with?</Label>
                        <div className="grid grid-cols-1 gap-3 pt-2">
                            {[
                                "Answer FAQs",
                                "Order tracking",
                                "Account issues",
                                "Technical support",
                                "Product information",
                                "Billing & payments",
                                "General inquiries",
                            ].map((option) => (
                                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => handleCheckboxChange("chatbotPurpose", option)}>
                                    <Checkbox
                                        id={`purpose-${option}`}
                                        checked={formData.chatbotPurpose.includes(option)}
                                        onCheckedChange={() =>
                                            handleCheckboxChange("chatbotPurpose", option)
                                        }
                                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <Label htmlFor={`purpose-${option}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Label className="text-foreground">How should your chatbot communicate?</Label>
                        <RadioGroup
                            value={formData.chatbotPersonality}
                            onValueChange={(value: string) =>
                                setFormData({ ...formData, chatbotPersonality: value })
                            }
                            className="grid grid-cols-1 gap-3 pt-2"
                        >
                            {[
                                "Friendly & Casual",
                                "Professional & Formal",
                                "Technical Assistant",
                                "Sales-focused",
                            ].map((option) => (
                                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, chatbotPersonality: option })}>
                                    <RadioGroupItem value={option} id={`personality-${option}`} className="border-primary text-primary" />
                                    <Label htmlFor={`personality-${option}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <Label className="text-foreground">Which languages should your chatbot support?</Label>
                        <div className="grid grid-cols-1 gap-3 pt-2">
                            {["English", "Hindi", ...formData.supportedLanguages.filter(l => l !== "English" && l !== "Hindi")].map((option) => (
                                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => handleCheckboxChange("supportedLanguages", option)}>
                                    <Checkbox
                                        id={`language-${option}`}
                                        checked={formData.supportedLanguages.includes(option)}
                                        onCheckedChange={() =>
                                            handleCheckboxChange("supportedLanguages", option)
                                        }
                                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                    <Label htmlFor={`language-${option}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                </div>
                            ))}

                            <div className="flex items-center space-x-2 pt-2">
                                <Input
                                    placeholder="Add another language (e.g. Spanish)"
                                    value={otherLanguage}
                                    onChange={(e) => setOtherLanguage(e.target.value)}
                                    className="bg-background border-input text-foreground h-11"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddOtherLanguage();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddOtherLanguage}
                                    className="h-11 px-4"
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-4">
                        <Label className="text-foreground">How do you want to train your chatbot initially?</Label>
                        <RadioGroup
                            value={formData.knowledgeBaseSetup}
                            onValueChange={(value: string) =>
                                setFormData({ ...formData, knowledgeBaseSetup: value })
                            }
                            className="grid grid-cols-1 gap-3 pt-2"
                        >
                            {[
                                "Add FAQs manually",
                                "Upload FAQ document (later)",
                                "Use sample template",
                            ].map((option) => (
                                <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, knowledgeBaseSetup: option })}>
                                    <RadioGroupItem value={option} id={`knowledge-${option}`} className="border-primary text-primary" />
                                    <Label htmlFor={`knowledge-${option}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                )}

                <div className="flex justify-between pt-6 border-t border-border mt-4">
                    <div className="flex items-center space-x-2">
                        {step === 1 ? (
                            <Button
                                variant="ghost"
                                onClick={async () => {
                                    await saveToDatabase(formData, step);
                                    if (onDismiss) onDismiss();
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Skip for now
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={handlePrev}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Back
                            </Button>
                        )}
                    </div>
                    {step < 5 ? (
                        <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                            {loading ? "Saving..." : "Finish Setup"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
