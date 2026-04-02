import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardOverview() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-[60px]" />
                </div>
                <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-8 w-[80px]" />
                </div>
                <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col gap-2">
                    <Skeleton className="h-4 w-[90px]" />
                    <Skeleton className="h-8 w-[100px]" />
                </div>
            </div>
            <div className="min-h-[400px] flex-1 rounded-xl bg-muted/50 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-10 w-[120px]" />
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[300px]" />
                            <Skeleton className="h-4 w-[220px]" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[280px]" />
                            <Skeleton className="h-4 w-[180px]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
