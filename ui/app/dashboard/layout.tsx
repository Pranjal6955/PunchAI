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
    const realSegments = pathname.split('/').filter(segment => segment !== '')

    // Special Case: Data Source Detail flow override
    const isBotDataSource = pathname.startsWith("/dashboard/dataSource/") && realSegments.length === 3
    const displaySegments = isBotDataSource ? ["dataSource", "id"] : realSegments

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-4 pr-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14">
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <SidebarTrigger className="-ml-1" />
                        <Breadcrumb className="hidden md:block">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                {displaySegments.map((segment, index) => {
                                    const isLast = index === displaySegments.length - 1

                                    // Map Href
                                    let href = ""
                                    if (isBotDataSource) {
                                        href = index === 0 ? "/dashboard/dataSource" : pathname
                                    } else {
                                        href = `/${realSegments.slice(0, index + 1).join('/')}`
                                    }

                                    // Map Title
                                    let title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z])/g, ' $1').trim()
                                    if (segment === "dashboard") title = "Overview"
                                    if (segment === "chatbot") title = "Chatbots"
                                    if (segment === "dataSource") title = "Data Sources"

                                    // Special segment handling for overrides (Data Source Flow)
                                    if (segment === "id" && headerTitle) {
                                        title = headerTitle
                                    } else if (segment === "id") {
                                        title = "Details"
                                    } else if (segment.length > 20 && headerTitle) {
                                        title = headerTitle
                                    }

                                    return (
                                        <React.Fragment key={`${index}-${segment}`}>
                                            <BreadcrumbItem>
                                                {isLast ? (
                                                    <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={href}>
                                                        {title}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLast && <BreadcrumbSeparator />}
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
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 text-foreground">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
