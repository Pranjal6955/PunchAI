"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <div className="bg-background mx-auto min-h-full w-full space-y-8 p-4 md:p-6 lg:p-8">
      {/* Header Skeleton */}
      <div className="border-border/40 flex flex-col items-start justify-between gap-6 border-b pb-8 md:flex-row md:items-center">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 rounded-none" />
          <Skeleton className="h-5 w-48 rounded-none opacity-60" />
        </div>
        <Skeleton className="shadow-primary/5 h-11 w-40 rounded-none shadow-lg" />
      </div>

      {/* Stats Skeleton Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-border/60 space-y-4 border p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-none tracking-widest uppercase opacity-40" />
              <Skeleton className="h-4 w-4 rounded-none opacity-40" />
            </div>
            <Skeleton className="h-8 w-16 rounded-none" />
            <Skeleton className="h-3 w-32 rounded-none opacity-40" />
          </div>
        ))}
      </div>

      {/* Main Section Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-none" />
          <Skeleton className="h-4 w-20 rounded-none opacity-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-border/40 space-y-6 border p-6">
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-16 rounded-none opacity-60" />
                <Skeleton className="h-4 w-4 rounded-none opacity-20" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-7 w-3/4 rounded-none" />
                <Skeleton className="h-4 w-full rounded-none opacity-40" />
                <Skeleton className="h-4 w-2/3 rounded-none opacity-40" />
              </div>
              <div className="border-border/40 flex items-center justify-between border-t pt-4">
                <Skeleton className="h-3 w-24 rounded-none opacity-30" />
                <Skeleton className="h-3 w-16 rounded-none opacity-30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section Skeleton */}
      <div className="border-border bg-card/50 space-y-8 border p-10 md:p-14">
        <div className="max-w-xl space-y-4">
          <Skeleton className="h-10 w-full rounded-none" />
          <Skeleton className="h-5 w-5/6 rounded-none opacity-40" />
          <Skeleton className="h-5 w-4/6 rounded-none opacity-40" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="shadow-primary/10 h-11 w-40 rounded-none shadow-lg" />
          <Skeleton className="h-11 w-40 rounded-none" />
        </div>
      </div>
    </div>
  );
}
