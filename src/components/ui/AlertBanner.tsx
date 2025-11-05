import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  variant?: "error" | "warning" | "info" | "success";
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function AlertBanner({
  variant = "info",
  message,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 5000,
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay, onDismiss]);

  if (!isVisible) return null;

  const icons = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  };

  const variants = {
    error: "border-destructive/50 text-destructive bg-destructive/10",
    warning: "border-warning/50 text-warning bg-warning/10",
    info: "border-primary/50 text-primary bg-primary/10",
    success: "border-success/50 text-success bg-success/10",
  };

  return (
    <Alert
      className={cn(
        "animate-in slide-in-from-top-2 duration-300",
        variants[variant]
      )}
    >
      <div className="flex items-start gap-3 w-full">
        {icons[variant]}
        <AlertDescription className="flex-1">{message}</AlertDescription>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
