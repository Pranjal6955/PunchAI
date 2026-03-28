"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import React from "react"

export function AppHeader() {
    const pathname = usePathname()
    // Split pathname into segments, excluding empty strings
    const segments = pathname.split('/').filter(Boolean)

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:h-[60px] bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    {/* The root dashboard link is always visible on desktop */}
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/dashboard" className="transition-colors hover:text-black dark:hover:text-white">
                            Dashboard
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    {/* If we're deeper than /dashboard (e.g. /dashboard/dataSource) */}
                    {segments.length > 1 && <BreadcrumbSeparator className="hidden md:block" />}

                    {/* Map relevant segments after /dashboard */}
                    {segments.slice(1).map((segment, index, array) => {
                        const isLast = index === array.length - 1

                        // Simple formatting: capitalize first letter and handle camelCase
                        const formattedLabel = segment
                            .replace(/([A-Z])/g, ' $1') // insert space before capital letters
                            .replace(/^./, str => str.toUpperCase()) // capitalize first letter
                            .trim()

                        const href = `/${segments.slice(0, index + 2).join('/')}`

                        return (
                            <React.Fragment key={segment}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="font-semibold text-black dark:text-zinc-50">
                                            {formattedLabel}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            href={href}
                                            className="transition-colors hover:text-black dark:hover:text-white"
                                        >
                                            {formattedLabel}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                            </React.Fragment>
                        )
                    })}

                    {/* Fallback for home dash when exactly at /dashboard */}
                    {segments.length === 1 && segments[0] === 'dashboard' && (
                        <>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-semibold text-black dark:text-zinc-50">Overview</BreadcrumbPage>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
