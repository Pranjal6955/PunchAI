"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

export function AppHeader() {
    const [user, setUser] = useState<{ fullName: string, email: string, isOnboarded?: boolean, onboardingStep?: number } | null>(null)
    const [onboardingStep, setOnboardingStep] = useState<number>(1)
    const router = useRouter()
    const pathname = usePathname()

    // Determine page title from URL
    const segments = pathname.split('/').filter(Boolean)
    const currentSegment = segments.length > 1 ? segments[segments.length - 1] : "overview"
    const pageTitle = currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
                const res = await fetch(`${url}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    // Handle both { user: ... } and direct user object responses
                    const userData = data.user || data
                    setUser(userData)
                    if (userData.onboardingStep) {
                        setOnboardingStep(userData.onboardingStep)
                    }
                } else {
                    localStorage.removeItem("token")
                    router.push("/login")
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error)
            }
        }

        fetchUser()

        // Get persistent onboarding step
        const getStep = () => {
            const step = localStorage.getItem("onboarding_step")
            if (step) setOnboardingStep(parseInt(step))
        }

        getStep()

        // Listen for storage changes (for same window sync, we'll also use custom event)
        const handleSync = () => {
            getStep()
            const userData = localStorage.getItem("user")
            if (userData) {
                try {
                    const parsed = JSON.parse(userData)
                    setUser(prev => ({ ...prev, ...parsed }))
                } catch { }
            }
        }

        window.addEventListener("storage", handleSync)
        window.addEventListener("onboarding_update", handleSync)

        return () => {
            window.removeEventListener("storage", handleSync)
            window.removeEventListener("onboarding_update", handleSync)
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("onboarding_skipped")
        localStorage.removeItem("onboarding_step")
        localStorage.removeItem("onboarding_form_data")
        router.push("/login")
    }

    const handleResumeOnboarding = () => {
        localStorage.removeItem("onboarding_skipped")
        window.location.reload()
    }

    // Progress calculation for the ring
    const totalSteps = 5
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (onboardingStep / totalSteps) * circumference

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex items-center gap-4">
                {user && !user.isOnboarded && (
                    <button
                        onClick={handleResumeOnboarding}
                        className="group relative flex items-center justify-center h-10 w-10 rounded-full transition-transform hover:scale-105"
                        title="Resume Setup"
                    >
                        {/* Progress Ring */}
                        <svg className="absolute inset-0 h-full w-full -rotate-90">
                            {/* Background Track */}
                            <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-muted-foreground/20"
                            />
                            {/* Active Progress */}
                            <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                fill="transparent"
                                stroke={onboardingStep === totalSteps ? "#22c55e" : "white"}
                                strokeWidth="2"
                                strokeDasharray={circumference}
                                style={{ strokeDashoffset }}
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-in-out"
                            />
                        </svg>

                        {/* Logo in the center */}
                        <div className="relative h-[30px] w-[30px] rounded-full overflow-hidden flex items-center justify-center">
                            <Image src="/Logo_dark_theme.png" alt="Setup Progress" width={30} height={30} className="object-contain scale-90" />
                        </div>

                        {/* Tooltip on hover (simulated with peer/group) */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            Onboarding Progress
                        </div>
                    </button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-auto flex items-center gap-2 rounded-20px p-1 pr-3 hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                                <AvatarFallback>{user?.fullName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline-flex text-sm font-medium">
                                {user?.fullName || "Loading..."}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.fullName || "Loading..."}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email || "..."}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings" className="w-full cursor-pointer">
                                Profile Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
