import { Skeleton } from "@/components/ui/skeleton";

export function MentionsSkeleton() {
  return (
    <div className="space-y-0">
      <Skeleton className="h-7 w-48 mb-4" />
      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
