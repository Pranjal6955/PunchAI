"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getStoredAccessToken, refreshAccessToken } from "@/lib/api-session";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const ensureSession = async () => {
      let token = getStoredAccessToken();

      if (!token) {
        token = await refreshAccessToken();
      }

      if (!token) {
        router.replace("/login");
        return;
      }

      setIsCheckingAuth(false);
    };

    void ensureSession();
  }, [router]);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="bg-background flex w-full flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          {isCheckingAuth ? (
            <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">Securely Initializing...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
