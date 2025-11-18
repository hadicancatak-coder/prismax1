import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  actions,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon className="h-7 w-7 text-primary flex-shrink-0" />}
        <div className="flex-1">
          <h1 className="text-page-title">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
