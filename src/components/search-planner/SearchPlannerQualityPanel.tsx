import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AD_STRENGTH_THRESHOLDS } from "@/config/searchAdsConfig";

interface QualityMetric {
  name: string;
  score: number;
  maxScore: number;
  status: 'success' | 'warning' | 'error';
}

interface ComplianceIssue {
  type: 'error' | 'warning';
  message: string;
  field?: string;
}

interface SearchPlannerQualityPanelProps {
  adStrength: {
    score: number;
    strength: string;
    suggestions: string[];
  };
  complianceIssues: ComplianceIssue[];
  metrics?: QualityMetric[];
}

export function SearchPlannerQualityPanel({
  adStrength,
  complianceIssues,
  metrics = [],
}: SearchPlannerQualityPanelProps) {
  
  const strengthLabel = useMemo(() => {
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.excellent) return 'Excellent';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.good) return 'Good';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.average) return 'Average';
    return 'Poor';
  }, [adStrength.score]);

  const strengthColor = useMemo(() => {
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.excellent) return 'text-success';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.good) return 'text-primary';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.average) return 'text-warning';
    return 'text-destructive';
  }, [adStrength.score]);

  const progressColor = useMemo(() => {
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.excellent) return 'bg-success';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.good) return 'bg-primary';
    if (adStrength.score >= AD_STRENGTH_THRESHOLDS.average) return 'bg-warning';
    return 'bg-destructive';
  }, [adStrength.score]);

  const errorIssues = complianceIssues.filter(i => i.type === 'error');
  const warningIssues = complianceIssues.filter(i => i.type === 'warning');

  return (
    <div className="space-y-md">
      {/* Ad Strength Card */}
      <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-md pb-sm border-b border-border bg-card">
          <CardTitle className="text-body-sm font-semibold text-foreground flex items-center gap-xs">
            <TrendingUp className="h-4 w-4 text-primary" />
            Ad Strength
          </CardTitle>
        </CardHeader>
        <CardContent className="p-md space-y-md">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-xs">
              <span className={cn("text-heading-lg font-bold", strengthColor)}>
                {adStrength.score}
              </span>
              <span className="text-metadata text-muted-foreground">/100</span>
            </div>
            <Badge 
              variant={adStrength.score >= AD_STRENGTH_THRESHOLDS.good ? "default" : "secondary"}
              className="text-metadata font-medium"
            >
              {strengthLabel}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-xs">
            <Progress 
              value={adStrength.score} 
              className="h-2 bg-muted"
            />
            <div className="flex justify-between text-metadata text-muted-foreground">
              <span>Poor</span>
              <span>Average</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Metrics Breakdown */}
          {metrics.length > 0 && (
            <div className="space-y-xs pt-sm border-t border-border">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-body-sm text-foreground">{metric.name}</span>
                  <div className="flex items-center gap-xs">
                    <span className={cn(
                      "text-metadata font-medium",
                      metric.status === 'success' && 'text-success',
                      metric.status === 'warning' && 'text-warning',
                      metric.status === 'error' && 'text-destructive'
                    )}>
                      {metric.score}/{metric.maxScore}
                    </span>
                    {metric.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    {metric.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                    {metric.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {adStrength.suggestions.length > 0 && (
            <div className="space-y-xs pt-sm border-t border-border">
              <p className="text-metadata font-medium text-muted-foreground uppercase tracking-wide">
                Suggestions
              </p>
              <div className="space-y-xs">
                {adStrength.suggestions.slice(0, 3).map((suggestion, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-xs p-sm bg-muted/50 rounded-md"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
                    <span className="text-metadata text-foreground">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Issues */}
      {(errorIssues.length > 0 || warningIssues.length > 0) && (
        <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-md pb-sm border-b border-border bg-card">
            <CardTitle className="text-body-sm font-semibold text-foreground flex items-center gap-xs">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Compliance Check
            </CardTitle>
          </CardHeader>
          <CardContent className="p-md space-y-sm">
            {/* Error Issues */}
            {errorIssues.length > 0 && (
              <div className="space-y-xs">
                {errorIssues.map((issue, i) => (
                  <Alert 
                    key={i} 
                    variant="destructive" 
                    className="bg-destructive/10 border-destructive/30"
                  >
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-body-sm">
                      {issue.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Warning Issues */}
            {warningIssues.length > 0 && (
              <div className="space-y-xs">
                {warningIssues.map((issue, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-xs p-sm bg-warning/10 border border-warning/30 rounded-md"
                  >
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <span className="text-body-sm text-foreground">{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* All Clear */}
            {errorIssues.length === 0 && warningIssues.length === 0 && (
              <div className="flex items-center gap-xs p-sm bg-success/10 border border-success/30 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-body-sm text-success">All compliance checks passed</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
