import { useEntityAdRules } from "@/hooks/useEntityAdRules";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMemo } from "react";

interface InlineComplianceValidatorProps {
  value: string;
  entity: string;
  fieldType: "headline" | "description";
}

export function InlineComplianceValidator({ value, entity, fieldType }: InlineComplianceValidatorProps) {
  const { rules, isLoading } = useEntityAdRules(entity);

  const violations = useMemo(() => {
    if (!rules || !value.trim()) return [];
    
    const issues: string[] = [];
    const lowerValue = value.toLowerCase();

    // Check prohibited words
    if (Array.isArray(rules.prohibited_words)) {
      rules.prohibited_words.forEach(word => {
        if (lowerValue.includes(word.toLowerCase())) {
          issues.push(`"${word}" - Prohibited word`);
        }
      });
    }

    // Check competitor names
    if (Array.isArray(rules.competitor_names)) {
      rules.competitor_names.forEach(name => {
        if (lowerValue.includes(name.toLowerCase())) {
          issues.push(`"${name}" - Competitor name not allowed`);
        }
      });
    }

    return issues;
  }, [rules, value]);

  if (isLoading || violations.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="destructive" 
            className="ml-sm gap-xs cursor-help animate-pulse"
          >
            <AlertCircle className="h-3 w-3" />
            {violations.length} {violations.length === 1 ? 'issue' : 'issues'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-xs">
            <p className="font-semibold text-metadata">Compliance Issues:</p>
            {violations.map((issue, idx) => (
              <p key={idx} className="text-metadata">• {issue}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
