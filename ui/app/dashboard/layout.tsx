import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset className="bg-background/50 dark:bg-background/20 overflow-hidden">
                <DashboardHeader />
                <main className="no-scrollbar h-[calc(100vh-4rem)] flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
