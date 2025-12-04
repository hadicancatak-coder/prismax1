import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** Show breadcrumb path before title */
  breadcrumb?: string[];
  className?: string;
}

/**
 * Standardized page header with title, description, and optional actions
 * Used at the top of every page for consistency
 */
export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  actions,
  breadcrumb,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  {index > 0 && <span>/</span>}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
