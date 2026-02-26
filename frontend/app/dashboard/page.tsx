"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingScreen from "./components/onboardingScreen";

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (!data.isOnboarded) {
                        setNeedsOnboarding(true);
                    }
                    setLoading(false);
                } else {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error("Auth check failed", err);
                window.location.href = "/login";
            }
        };

        checkStatus();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className={`${needsOnboarding ? "blur-md pointer-events-none" : ""}`}>
                <h1 className="text-3xl font-bold tracking-tight">Welcome to PunchAI</h1>
                <p className="text-muted-foreground">
                    Build and manage your generative AI chatbots from this central hub.
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center border border-dashed">
                            <span className="text-xs text-muted-foreground">Stat Card {i}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-8 h-[400px] rounded-xl bg-muted/50 flex items-center justify-center border border-dashed">
                    <span className="text-xs text-muted-foreground">Main Content area</span>
                </div>
            </div>

            {needsOnboarding && <OnboardingScreen onDismiss={() => setNeedsOnboarding(false)} />}
        </div>
    );
}
