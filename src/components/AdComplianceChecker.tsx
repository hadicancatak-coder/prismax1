import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { checkCompliance, type ComplianceIssue } from "@/lib/adQualityScore";
import { useEntityAdRules } from "@/hooks/useEntityAdRules";

interface AdComplianceCheckerProps {
  headlines: string[];
  descriptions: string[];
  sitelinks: string[];
  callouts: string[];
  entity?: string;
}

export const AdComplianceChecker = ({
  headlines,
  descriptions,
  sitelinks,
  callouts,
  entity,
}: AdComplianceCheckerProps) => {
  const { rules } = useEntityAdRules(entity);
  const issues = checkCompliance(
    headlines, 
    descriptions, 
    sitelinks, 
    callouts, 
    entity,
    rules ? { prohibited_words: rules.prohibited_words, competitor_names: rules.competitor_names } : undefined
  );
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (issues.length === 0) {
    return (
      <Card className="border-green-500/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Compliance Check - All Clear ✓</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No compliance issues detected. Your ad follows brand guidelines.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={errors.length > 0 ? "border-red-500/50" : "border-yellow-500/50"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {errors.length > 0 ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <CardTitle className="text-lg">Compliance Issues Found</CardTitle>
          </div>
          <div className="flex gap-2">
            {errors.length > 0 && (
              <Badge variant="destructive">{errors.length} Error{errors.length > 1 ? 's' : ''}</Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {errors.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm text-red-500">⛔ Errors (Must Fix)</div>
            <ul className="space-y-2">
              {errors.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{issue.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Field: {issue.field}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm text-yellow-500">⚠️ Warnings (Recommended)</div>
            <ul className="space-y-2">
              {warnings.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{issue.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Field: {issue.field}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
