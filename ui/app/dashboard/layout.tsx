"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import React from "react"
import { HeaderProvider, useHeader } from "@/lib/header-context"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <HeaderProvider>
            <DashboardContent children={children} />
        </HeaderProvider>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { title: headerTitle } = useHeader()
    const pathSegments = pathname.split('/').filter(segment => segment !== '')

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex flex-1 items-center justify-between px-4 gap-2">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {pathSegments.map((segment, index) => {
                                        const href = `/${pathSegments.slice(0, index + 1).join('/')}`
                                        const isLast = index === pathSegments.length - 1

                                        let title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                        if (segment === "dashboard") title = "Overview"
                                        if (segment === "chatbot") title = "Chatbots"
                                        if (segment === "dataSource") title = "Data Sources"

                                        const isBotID = index === 2 && pathSegments[1]?.toLowerCase() === "chatbot"
                                        if (isBotID && headerTitle) {
                                            title = headerTitle
                                        } else if (segment.length > 20 && headerTitle) {
                                            title = headerTitle
                                        } else if (isBotID || segment.length > 20) {
                                            title = "Details"
                                        }

                                        return (
                                            <React.Fragment key={href}>
                                                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                                                    {isLast ? (
                                                        <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink href={href}>
                                                            {title}
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                                            </React.Fragment>
                                        )
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {/* Header Actions Placeholder */}
                            <div className="hidden md:flex items-center px-3 h-9 rounded-md border border-input bg-background/50 text-muted-foreground text-sm cursor-text hover:bg-background/80 transition-colors mr-2">
                                <span className="mr-8">Search chatbots...</span>
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 text-foreground">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
