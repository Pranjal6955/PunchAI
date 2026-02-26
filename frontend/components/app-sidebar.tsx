"use client"

import * as React from "react"
import Link from "next/link"
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    HelpCircle,
    BarChart3,
    Sparkles,
    Command,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"

const navMain = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
    },
    {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
    },
    {
        title: "Chatbots",
        url: "/dashboard/chatbots",
        icon: MessageSquare,
    },
    {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
    },
]

const navSecondary = [
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Help & Support",
        url: "/dashboard/support",
        icon: HelpCircle,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">PunchAI</span>
                                    <span className="truncate text-xs">GenAI Support</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navSecondary.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild size="sm" tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Upgrade to Pro</span>
                                <span className="truncate text-xs">Unlock advanced AI</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
