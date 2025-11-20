import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepProps {
  stepNumber: number;
  title: string;
  completed: boolean;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function WizardStep({
  stepNumber,
  title,
  completed,
  isActive,
  onClick,
  children,
}: WizardStepProps) {
  return (
    <Card
      className={cn(
        "transition-smooth cursor-pointer",
        isActive && "ring-2 ring-primary",
        completed && "border-success/30"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-sm">
        <CardTitle className="flex items-center gap-sm text-heading-sm">
          {completed ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <Circle className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
          )}
          <span className={cn(completed && "text-success")}>
            Step {stepNumber}: {title}
          </span>
        </CardTitle>
      </CardHeader>
      {isActive && <CardContent>{children}</CardContent>}
    </Card>
  );
}
