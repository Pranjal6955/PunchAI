"use client";

import { useState, useEffect, useRef } from "react";
import { User, Camera, Lock, User as UserIcon, Save, Loader2 } from "lucide-react";
import { getProfile, updateProfile, uploadAvatar, User as UserType, getAvatarUrl } from "@/lib/api-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AccountPage() {
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const data = await getProfile();
                if (data) {
                    setUser(data);
                    setName(data.name || "");
                }
            } catch (error) {
                toast.error("Failed to fetch profile");
            } finally {
                setIsLoading(false);
            }
        }
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSavingProfile(true);
        try {
            const updated = await updateProfile(user.id, { name });
            if (updated) {
                setUser(updated);
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            toast.error("An error occurred while updating profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsSavingPassword(true);
        try {
            const updated = await updateProfile(user.id, { password });
            if (updated) {
                toast.success("Password updated successfully");
                setPassword("");
                setConfirmPassword("");
            } else {
                toast.error("Failed to update password");
            }
        } catch (error) {
            toast.error("An error occurred while updating password");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate size (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size should be less than 2MB");
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const updated = await uploadAvatar(file);
            if (updated) {
                setUser(updated);
                toast.success("Profile image updated");
            } else {
                toast.error("Failed to upload image");
            }
        } catch (error) {
            toast.error("An error occurred while uploading image");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-10 w-full min-h-full bg-background">
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-border/40 bg-background/50 backdrop-blur-sm rounded-none">
                            <CardHeader className="text-center">
                                <div className="relative mx-auto w-32 h-32 mb-4 group">
                                    <Avatar className="w-full h-full rounded-none border-2 border-border/50 transition-all group-hover:border-primary/50">
                                        <AvatarImage src={getAvatarUrl(user?.avatar)} />
                                        <AvatarFallback className="rounded-none bg-muted text-2xl font-bold">
                                            {user?.name?.substring(0, 2).toUpperCase() || "AI"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingAvatar}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                                    >
                                        {isUploadingAvatar ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <CardTitle className="truncate">{user?.name || "Premium User"}</CardTitle>
                                <CardDescription className="truncate">{user?.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Separator className="bg-border/40" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Member since</span>
                                    <span className="text-foreground">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Forms */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Form */}
                        <Card className="border-border/40 shadow-none rounded-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                    <CardTitle>Profile Information</CardTitle>
                                </div>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleUpdateProfile}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="bg-muted cursor-not-allowed rounded-none"
                                        />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            Email cannot be changed
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className="rounded-none focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-border/40 bg-muted/20 px-6 py-4">
                                    <Button
                                        type="submit"
                                        disabled={isSavingProfile || name === user?.name}
                                        className="rounded-none ml-auto"
                                    >
                                        {isSavingProfile ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Save Changes
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Password Form */}
                        <Card className="border-border/40 shadow-none rounded-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    <CardTitle>Security</CardTitle>
                                </div>
                                <CardDescription>Update your account password.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleUpdatePassword}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="rounded-none focus-visible:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="rounded-none focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-border/40 bg-muted/20 px-6 py-4">
                                    <Button
                                        type="submit"
                                        disabled={isSavingPassword || !password || password !== confirmPassword}
                                        className="rounded-none ml-auto"
                                        variant="secondary"
                                    >
                                        {isSavingPassword ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Lock className="mr-2 h-4 w-4" />
                                        )}
                                        Update Password
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
