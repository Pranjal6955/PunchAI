import { Skeleton } from "@/components/ui/skeleton"

export default function DataSourcePage() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
                    <p className="text-muted-foreground">Add and manage the data sources for your chatbots.</p>
                </div>
                <Skeleton className="h-10 w-[180px] bg-primary/20" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg bg-orange-500/20" />
                        <div>
                            <h3 className="font-semibold">Text Source</h3>
                            <p className="text-xs text-muted-foreground">Import text directly or paste content.</p>
                        </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-md" />
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-9 w-[100px]" />
                    </div>
                </div>

                <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg bg-blue-500/20" />
                        <div>
                            <h3 className="font-semibold">File Upload</h3>
                            <p className="text-xs text-muted-foreground">Upload PDF, DOCX, or TXT files.</p>
                        </div>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-[120px]" />
                    </div>
                </div>
            </div>

            <div className="flex-1 rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-7 w-[220px]" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-[120px]" />
                        <Skeleton className="h-9 w-[120px]" />
                    </div>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="h-10 w-10 rounded bg-muted-foreground/10" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-[180px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-4 w-[80px]" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
