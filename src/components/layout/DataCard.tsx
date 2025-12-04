import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataCardProps {
  children: ReactNode;
  className?: string;
  /** Add hover effect for clickable cards */
  interactive?: boolean;
  /** Remove padding for custom layouts */
  noPadding?: boolean;
  onClick?: () => void;
}

/**
 * Standardized data card with consistent styling
 * Used for wrapping tables, lists, and other data displays
 */
export function DataCard({ 
  children, 
  className, 
  interactive = false,
  noPadding = false,
  onClick 
}: DataCardProps) {
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-2xl",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        !noPadding && "p-4",
        interactive && "cursor-pointer hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface DataCardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Header section for DataCard
 */
export function DataCardHeader({ title, description, action, className }: DataCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
