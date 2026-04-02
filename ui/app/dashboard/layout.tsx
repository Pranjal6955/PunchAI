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

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const pathSegments = pathname.split('/').filter(segment => segment !== '')

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {pathSegments.map((segment, index) => {
                                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`
                                    const isLast = index === pathSegments.length - 1
                                    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/([A-Z])/g, ' $1').trim()

                                    return (
                                        <React.Fragment key={href}>
                                            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                                                {isLast ? (
                                                    <BreadcrumbPage>{title}</BreadcrumbPage>
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
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 text-foreground">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
