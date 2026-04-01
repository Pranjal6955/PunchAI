"use client"

import * as React from "react"
import {
    Blocks,
    Database,
    LayoutDashboard,
    MessageSquare,
    Settings,
    Shield,
    Zap,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import { usePathname } from "next/navigation"

const data = {
    navMain: [
        {
            title: "Overview",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Data Source",
            url: "/dashboard/data-source",
            icon: Database,
        },
        {
            title: "Integration",
            url: "/dashboard/integration",
            icon: Blocks,
        },
        {
            title: "Chatbot",
            url: "/dashboard/chatbot",
            icon: MessageSquare,
        },
    ],
}

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props} className="border-r">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <img src="/Logo_dark_theme.png" alt="PunchAI Logo" className="size-8" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight">PunchAI</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                        className="group transition-all duration-200 hover:bg-primary/10 hover:text-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-lg data-active:shadow-primary/20"
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="transition-transform group-hover:scale-110" />
                                            <span className="font-medium">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
