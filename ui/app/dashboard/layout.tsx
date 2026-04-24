"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getStoredAccessToken, refreshAccessToken } from "@/lib/api-session";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    // Initial check to avoid flickering if token exists
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const ensureSession = async () => {
      const token = getStoredAccessToken();

      if (token) {
        setIsCheckingAuth(false);
        return;
      }

      // Try refresh if no token
      const refreshedToken = await refreshAccessToken();

      if (!refreshedToken) {
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
            <PageSkeleton />
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
