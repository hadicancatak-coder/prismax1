import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  variant?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  onDismiss?: () => void;
}

const variants = {
  info: {
    icon: Info,
    className: "bg-primary/5 border-primary/20 text-primary",
    iconClass: "text-primary"
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning/10 border-warning/20 text-warning",
    iconClass: "text-warning"
  },
  success: {
    icon: CheckCircle,
    className: "bg-success/10 border-success/20 text-success",
    iconClass: "text-success"
  },
  error: {
    icon: XCircle,
    className: "bg-destructive/10 border-destructive/20 text-destructive",
    iconClass: "text-destructive"
  }
};

/**
 * Standardized alert banner for warnings, info, success, and error messages
 */
export function AlertBanner({ 
  variant = 'info', 
  title, 
  children, 
  className,
  action,
  onDismiss
}: AlertBannerProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconClass)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-medium mb-1">{title}</h4>
        )}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          className="flex-shrink-0 -mt-1 -mr-1 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
