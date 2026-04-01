"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DashboardHeader() {
    const pathname = usePathname()
    const pathSegments = pathname.split("/").filter(Boolean)

    const breadcrumbs = pathSegments.map((segment) => {
        return segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
    })

    return (
        <header className="bg-background/60 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-md transition-all duration-300">
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 hover:bg-primary/10 hover:text-primary transition-colors" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                <BreadcrumbItem className={index < breadcrumbs.length - 1 ? "hidden md:block" : ""}>
                                    {index === breadcrumbs.length - 1 ? (
                                        <BreadcrumbPage className="font-semibold tracking-tight">
                                            {crumb}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            href={`/${pathSegments.slice(0, index + 1).join("/")}`}
                                            className="hover:text-primary transition-colors font-medium"
                                        >
                                            {crumb}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {index < breadcrumbs.length - 1 && (
                                    <BreadcrumbSeparator className="hidden md:block" />
                                )}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    )
}
