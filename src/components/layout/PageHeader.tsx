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
 * Typography: H1=24px semibold, description=14px
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
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-md mb-lg", className)}>
      <div className="flex items-start gap-sm flex-1 min-w-0">
        {Icon && (
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-xs text-metadata text-muted-foreground mb-xs">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center gap-xs">
                  {index > 0 && <span className="text-border">/</span>}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
          {/* H1: Page title */}
          <h1 className="text-heading-lg font-semibold text-foreground tracking-tight leading-tight">{title}</h1>
          {description && (
            <p className="text-body-sm text-muted-foreground mt-xs">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-sm flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
