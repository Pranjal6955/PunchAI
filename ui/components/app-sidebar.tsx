"use client"

import * as React from "react"
import { LayoutDashboard, MessageSquareText, Database, Settings2 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"


import Image from "next/image"
import { usePathname } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState({
    name: "Admin",
    email: "admin@punchai.com",
    avatar: "/avatars/admin.jpg",
  })

  React.useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse user from localStorage", e)
      }
    }
  }, [])

  const navItems = [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Chatbot",
      url: "/dashboard/chatbot",
      icon: MessageSquareText,
      isActive: pathname === "/dashboard/chatbot",
    },
    {
      title: "Data Source",
      url: "/dashboard/dataSource",
      icon: Database,
      isActive: pathname === "/dashboard/dataSource",
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      isActive: pathname === "/dashboard/settings",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-background">
                  <Image
                    src="/Logo_dark_theme.png"
                    alt="PunchAI"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none px-2">
                  <span className="font-bold text-lg">PunchAI</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-4">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
