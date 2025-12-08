import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkingDaysBadgeProps {
  isWorking: boolean;
  className?: string;
}

export function WorkingDaysBadge({ isWorking, className }: WorkingDaysBadgeProps) {
  return (
    <div 
      className={cn(
        "h-2 w-2 rounded-full border-2 border-background",
        isWorking ? "bg-success" : "bg-destructive",
        className
      )}
      title={isWorking ? "Working Day" : "Non-Working Day"}
    />
  );
}
