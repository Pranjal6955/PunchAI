"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    // User data
    const [user, setUser] = useState<{ fullName: string, email: string, profileImage?: string } | null>(null);
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Construct base URL for images
    const BASE_URL = API_URL.replace("/api", "");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const userData = data.user || data;
                    setUser(userData);
                    setFullName(userData.fullName || "");
                    setLoading(false);
                } else {
                    localStorage.removeItem("token");
                    router.push("/login");
                }
            } catch (err) {
                console.error("Auth check failed", err);
                router.push("/login");
            }
        };

        fetchUser();
    }, [router, API_URL]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (password && password !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: "error" });
            return;
        }

        setUpdating(true);
        try {
            const token = localStorage.getItem("token");

            const payload: any = { fullName };
            if (password) {
                payload.password = password;
            }

            const res = await fetch(`${API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setUser(prev => ({ ...prev, ...data }));
                setMessage({ text: "Profile updated successfully!", type: "success" });
                setPassword("");
                setConfirmPassword("");

                // Dispatch event so header updates
                localStorage.setItem("user", JSON.stringify(data));
                window.dispatchEvent(new Event("storage"));
            } else {
                setMessage({ text: data.message || "Failed to update profile", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "An error occurred", type: "error" });
        } finally {
            setUpdating(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        setMessage({ text: "", type: "" });

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("image", file);

            const res = await fetch(`${API_URL}/auth/profile-image`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setUser(prev => prev ? ({ ...prev, profileImage: data.profileImage }) : null);
                setMessage({ text: "Profile image updated successfully!", type: "success" });

                // Dispatch event so header updates
                if (user) {
                    const updatedUser = { ...user, profileImage: data.profileImage };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    window.dispatchEvent(new Event("storage"));
                }
            } else {
                setMessage({ text: data.message || "Failed to upload image", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "An error occurred during upload", type: "error" });
        } finally {
            setImageUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    const profileImageUrl = user?.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL}${user.profileImage}`) : "";

    return (
        <div className="space-y-6 max-w-2xl mx-auto py-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Separator />

            {message.text && (
                <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>
                        Update your profile picture.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={profileImageUrl || "/placeholder-user.jpg"} alt={user?.fullName} />
                        <AvatarFallback className="text-2xl">{user?.fullName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept="image/jpeg, image/png, image/jpg, image/webp"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        <Button
                            variant="outline"
                            onClick={handleClickUpload}
                            disabled={imageUploading}
                        >
                            {imageUploading ? "Uploading..." : "Change Picture"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            JPG, PNG or WEBP. Max 5MB.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleUpdateProfile}>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>
                            Update your personal details and change your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
                            <p className="text-[0.8rem] text-muted-foreground">Your email cannot be changed.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <Separator className="my-6" />

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Change Password</h3>
                            <p className="text-[0.8rem] text-muted-foreground">Leave blank if you don't want to change your password.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
                        <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updating}>
                            {updating ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
