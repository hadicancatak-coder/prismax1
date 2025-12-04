import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Use 'default' for standard content pages, 'full' for tool pages like SearchPlanner, 'wide' for maximum width */
  size?: 'default' | 'full' | 'narrow' | 'wide';
}

/**
 * Standard page container with consistent max-width and padding
 * Used across all pages for layout consistency
 * Typography: H1=24px, H2=20px, H3=18px, Body=14-16px
 * Spacing: 32px top, 24px between cards
 */
export function PageContainer({ 
  children, 
  className,
  size = 'default' 
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        // Consistent vertical spacing: 32px top
        "pt-8 pb-8",
        // Consistent horizontal padding
        size === 'default' && "px-8 lg:px-12",
        size === 'wide' && "px-6 lg:px-8",
        size === 'full' && "px-4 lg:px-6",
        size === 'narrow' && "px-8 lg:px-12",
        className
      )}
    >
      <div 
        className={cn(
          "mx-auto",
          // 24px gap between sections
          "space-y-6",
          // Max widths: 1440px for wide, 1280px for default
          size === 'default' && "max-w-[1280px]",
          size === 'wide' && "max-w-[1440px]",
          size === 'full' && "max-w-full",
          size === 'narrow' && "max-w-4xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}
