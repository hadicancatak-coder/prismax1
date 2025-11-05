import { Skeleton } from "@/components/ui/skeleton";

export function MyDaySkeleton() {
  return (
    <div className="space-y-0">
      <Skeleton className="h-7 w-32 mb-4" />
      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
