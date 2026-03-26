// components/Skeleton.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`shimmer bg-zinc-200 rounded-md ${className}`} />
  )
}

export function OrgCardSkeleton() {
  return (
    <div className="p-4 border border-zinc-200 rounded-xl bg-white/50 flex flex-wrap gap-4 items-start shadow-sm animate-pulse">
      <div className="flex-1 min-w-[300px] space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex-shrink-0 min-w-full md:min-w-[300px]">
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
