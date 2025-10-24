import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:shadow-md",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:shadow-md",
        outline: "text-foreground border-border bg-background hover:bg-muted shadow-sm",
        success: "border-transparent bg-success text-success-foreground shadow-sm hover:shadow-md",
        warning: "border-transparent bg-warning text-warning-foreground shadow-sm hover:shadow-md",
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
