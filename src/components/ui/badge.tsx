import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/90 text-primary-foreground shadow-xs hover:bg-primary hover:shadow-sm",
        secondary: "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-xs",
        destructive: "border-transparent bg-destructive/90 text-destructive-foreground shadow-xs hover:bg-destructive hover:shadow-sm",
        outline: "text-foreground border-gray-300 bg-white/50 hover:bg-gray-50 shadow-xs",
        success: "border-transparent bg-success/90 text-success-foreground shadow-xs hover:bg-success hover:shadow-sm",
        warning: "border-transparent bg-warning/90 text-warning-foreground shadow-xs hover:bg-warning hover:shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
