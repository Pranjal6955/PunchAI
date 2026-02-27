import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AppHeader />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
