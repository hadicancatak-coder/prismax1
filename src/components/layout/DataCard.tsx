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
 * Apple-style soft shadows and rounded corners
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
        // Apple-style layered shadow
        "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)]",
        !noPadding && "p-5",
        interactive && "cursor-pointer hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200",
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
 * Typography: H3=18px medium
 */
export function DataCardHeader({ title, description, action, className }: DataCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div>
        <h3 className="text-[18px] font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
