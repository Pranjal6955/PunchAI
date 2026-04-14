"use client";

import { useState, useEffect, useRef } from "react";
import { User, Camera, Lock, User as UserIcon, Save, Loader2 } from "lucide-react";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  User as UserType,
  getAvatarUrl,
} from "@/lib/api-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full w-full space-y-10 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Sidebar / Info */}
          <div className="space-y-6 md:col-span-1">
            <Card className="border-border/40 bg-background/50 rounded-none backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="group relative mx-auto mb-4 h-32 w-32">
                  <Avatar className="border-border/50 group-hover:border-primary/50 h-full w-full rounded-none border-2 transition-all">
                    <AvatarImage src={getAvatarUrl(user?.avatar)} />
                    <AvatarFallback className="bg-muted rounded-none text-2xl font-bold">
                      {user?.name?.substring(0, 2).toUpperCase() || "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
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
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Member since</span>
                  <span className="text-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forms */}
          <div className="space-y-6 md:col-span-2">
            {/* Profile Form */}
            <Card className="border-border/40 rounded-none shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserIcon className="text-primary h-5 w-5" />
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
                    <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
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
                      className="focus-visible:ring-primary/20 rounded-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-border/40 bg-muted/20 border-t px-6 py-4">
                  <Button
                    type="submit"
                    disabled={isSavingProfile || name === user?.name}
                    className="ml-auto rounded-none"
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
            <Card className="border-border/40 rounded-none shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="text-primary h-5 w-5" />
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
                      className="focus-visible:ring-primary/20 rounded-none"
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
                      className="focus-visible:ring-primary/20 rounded-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-border/40 bg-muted/20 border-t px-6 py-4">
                  <Button
                    type="submit"
                    disabled={isSavingPassword || !password || password !== confirmPassword}
                    className="ml-auto rounded-none"
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
