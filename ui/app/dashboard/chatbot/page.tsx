import { Skeleton } from "@/components/ui/skeleton"

export default function ChatbotPage() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chatbots</h1>
                    <p className="text-muted-foreground">Manage your AI chatbots and their configurations.</p>
                </div>
                <Skeleton className="h-10 w-[150px]" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-[140px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                        </div>
                        <div className="space-y-2 py-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[80%]" />
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <Skeleton className="h-4 w-[60px]" />
                            <Skeleton className="h-8 w-[80px]" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-7 w-[180px]" />
                    <Skeleton className="h-9 w-[100px]" />
                </div>
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[120px]" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
