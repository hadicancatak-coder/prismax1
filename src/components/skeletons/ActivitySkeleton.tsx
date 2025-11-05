import { Skeleton } from "@/components/ui/skeleton";

export function ActivitySkeleton() {
  return (
    <div className="space-y-0">
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
