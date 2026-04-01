import { cn } from "@/lib/utils"

export function DottedBackground({
    children,
    className,
}: {
    children?: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("relative min-h-svh w-full bg-background overflow-hidden", className)}>
            <div className="absolute inset-0 z-0 bg-dot-pattern pointer-events-none" aria-hidden="true" />
            <div className="relative z-10 w-full flex min-h-svh flex-col items-center justify-center">
                {children}
            </div>
        </div>
    )
}
