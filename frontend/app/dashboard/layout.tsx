"use client"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getStoredAccessToken, refreshAccessToken } from "@/lib/api-session";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (isCheckingAuth) {
    return null;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="flex w-full flex-col bg-background">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
