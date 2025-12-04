import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Use 'default' for standard content pages, 'full' for tool pages like SearchPlanner */
  size?: 'default' | 'full' | 'narrow';
}

/**
 * Standard page container with consistent max-width and padding
 * Used across all pages for layout consistency
 */
export function PageContainer({ 
  children, 
  className,
  size = 'default' 
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        "min-h-screen bg-background py-6 lg:py-8",
        size === 'default' && "px-6 lg:px-8",
        size === 'full' && "px-4 lg:px-6",
        size === 'narrow' && "px-6 lg:px-8",
        className
      )}
    >
      <div 
        className={cn(
          "mx-auto space-y-6",
          size === 'default' && "max-w-[1400px]",
          size === 'full' && "max-w-full",
          size === 'narrow' && "max-w-4xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}
