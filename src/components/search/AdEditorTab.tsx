import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import { WizardStep } from "./WizardStep";
import { Progress } from "@/components/ui/progress";

interface AdEditorTabProps {
  onSave: () => void;
  onCancel: () => void;
}

export function AdEditorTab({ onSave, onCancel }: AdEditorTabProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, title: "Basic Info", completed: currentStep > 1 },
    { number: 2, title: "Headlines", completed: currentStep > 2 },
    { number: 3, title: "Descriptions", completed: currentStep > 3 },
    { number: 4, title: "Extensions", completed: currentStep > 4 },
    { number: 5, title: "Settings", completed: currentStep > 5 },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with progress */}
      <div className="p-md border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-sm">
          <Button variant="ghost" onClick={onCancel} className="gap-xs">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <Button onClick={onSave} className="gap-xs">
              <Save className="h-4 w-4" />
              Save Ad
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Wizard steps */}
      <div className="flex-1 overflow-auto p-md space-y-md">
        {steps.map((step) => (
          <WizardStep
            key={step.number}
            stepNumber={step.number}
            title={step.title}
            completed={step.completed}
            isActive={currentStep === step.number}
            onClick={() => setCurrentStep(step.number)}
          >
            <div className="p-md bg-muted/50 rounded-lg">
              <p className="text-body text-muted-foreground">
                Step {step.number} content will be implemented here with actual form fields.
              </p>
            </div>
          </WizardStep>
        ))}
      </div>
    </div>
  );
}
