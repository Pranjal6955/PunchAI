"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

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
        <div className="p-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">You are viewing the protected dashboard space.</p>
        </div>
    );
}
