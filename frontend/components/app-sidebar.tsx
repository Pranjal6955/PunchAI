"use client"

import * as React from "react"
import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    Command,
    CreditCard,
    Database,
    LayoutDashboard,
    LogOut,
    Sparkles,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

import { usePathname } from "next/navigation"

// This is sample data.
const data = {
    user: {
        name: "[FULL_NAME]",
        email: "[EMAIL_ADDRESS]",
        avatar: "/avatars/user.jpg",
    },
    navMain: [
        {
            title: "Overview",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Data Sources",
            url: "/dashboard/dataSource",
            icon: Database,
        },
    ],
}

import Image from "next/image"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const [user, setUser] = React.useState(data.user)

    React.useEffect(() => {
        const storedUser = localStorage.getItem("punch_user")
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser)
                setUser({
                    name: parsedUser.name || parsedUser.fullName || parsedUser.username || data.user.name,
                    email: parsedUser.email || data.user.email,
                    avatar: parsedUser.avatar || data.user.avatar,
                })
            } catch (e) {
                console.error("Failed to parse punch_user from localStorage", e)
            }
        }
    }, [])

    return (
        <Sidebar collapsible="icon" className="gap-4" {...props}>
            <SidebarHeader className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Image
                                        src="/Logo_dark_theme.png"
                                        alt="PunchAI Logo"
                                        width={28}
                                        height={28}
                                        className="rounded-lg object-contain"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-bold text-black dark:text-zinc-50 text-lg">Punch AI</span>
                                    <span className="truncate text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium leading-none">Chatbot Agent</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {data.navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                                    <a href={item.url}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="rounded-lg lowercase">
                                            {user.name.split(" ").map(n => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{user.name}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback className="rounded-lg">
                                                {user.name.split(" ").map(n => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user.name}</span>
                                            <span className="truncate text-xs">{user.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles className="mr-2 size-4" />
                                        Upgrade to Pro
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <BadgeCheck className="mr-2 size-4" />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CreditCard className="mr-2 size-4" />
                                        Billing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Bell className="mr-2 size-4" />
                                        Notifications
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                    localStorage.removeItem("punch_token")
                                    localStorage.removeItem("punch_user")
                                    window.location.href = "/login"
                                }}>
                                    <LogOut className="mr-2 size-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
