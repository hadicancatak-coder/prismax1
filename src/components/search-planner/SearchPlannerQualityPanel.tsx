import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AD_STRENGTH_THRESHOLDS } from "@/config/searchAdsConfig";
import { calculateAdStrength, checkCompliance } from "@/lib/adQualityScore";

interface Sitelink {
  description: string;
  link: string;
}

interface SearchPlannerQualityPanelProps {
  headlines: string[];
  descriptions: string[];
  sitelinks: Sitelink[];
  callouts: string[];
  entity: string;
}

export function SearchPlannerQualityPanel({
  headlines,
  descriptions,
  sitelinks,
  callouts,
  entity,
}: SearchPlannerQualityPanelProps) {
  
  // Calculate ad strength internally
  const adStrength = useMemo(() => {
    const validHeadlines = headlines.filter(h => h?.trim());
    const validDescriptions = descriptions.filter(d => d?.trim());
    const validSitelinks = sitelinks.filter(s => s?.description?.trim()).map(s => s.description);
    const validCallouts = callouts.filter(c => c?.trim());
    
    return calculateAdStrength(validHeadlines, validDescriptions, validSitelinks, validCallouts);
  }, [headlines, descriptions, sitelinks, callouts]);

  // Calculate compliance issues internally
  const complianceIssues = useMemo(() => {
    const validHeadlines = headlines.filter(h => h?.trim());
    const validDescriptions = descriptions.filter(d => d?.trim());
    const validSitelinks = sitelinks.filter(s => s?.description?.trim()).map(s => s.description);
    const validCallouts = callouts.filter(c => c?.trim());
    
    return checkCompliance(validHeadlines, validDescriptions, validSitelinks, validCallouts, entity);
  }, [headlines, descriptions, sitelinks, callouts, entity]);

  const score = typeof adStrength === 'number' ? adStrength : adStrength.score;
  const suggestions = typeof adStrength === 'object' ? (adStrength.suggestions || []) : [];
  
  const strengthLabel = useMemo(() => {
    if (score >= AD_STRENGTH_THRESHOLDS.excellent) return 'Excellent';
    if (score >= AD_STRENGTH_THRESHOLDS.good) return 'Good';
    if (score >= AD_STRENGTH_THRESHOLDS.average) return 'Average';
    return 'Poor';
  }, [score]);

  const strengthColor = useMemo(() => {
    if (score >= AD_STRENGTH_THRESHOLDS.excellent) return 'text-success';
    if (score >= AD_STRENGTH_THRESHOLDS.good) return 'text-primary';
    if (score >= AD_STRENGTH_THRESHOLDS.average) return 'text-warning';
    return 'text-destructive';
  }, [score]);

  const errorIssues = complianceIssues.filter(i => i.severity === 'error');
  const warningIssues = complianceIssues.filter(i => i.severity === 'warning');

  // Calculate metrics
  const metrics = useMemo(() => {
    const validHeadlines = headlines.filter(h => h?.trim());
    const validDescriptions = descriptions.filter(d => d?.trim());
    const validSitelinks = sitelinks.filter(s => s?.description?.trim());
    const validCallouts = callouts.filter(c => c?.trim());
    
    return [
      {
        name: 'Headlines',
        current: validHeadlines.length,
        required: 3,
        recommended: 15,
        status: validHeadlines.length >= 10 ? 'success' : validHeadlines.length >= 3 ? 'warning' : 'error'
      },
      {
        name: 'Descriptions',
        current: validDescriptions.length,
        required: 2,
        recommended: 4,
        status: validDescriptions.length >= 4 ? 'success' : validDescriptions.length >= 2 ? 'warning' : 'error'
      },
      {
        name: 'Sitelinks',
        current: validSitelinks.length,
        required: 0,
        recommended: 4,
        status: validSitelinks.length >= 4 ? 'success' : validSitelinks.length >= 2 ? 'warning' : 'neutral'
      },
      {
        name: 'Callouts',
        current: validCallouts.length,
        required: 0,
        recommended: 4,
        status: validCallouts.length >= 4 ? 'success' : validCallouts.length >= 2 ? 'warning' : 'neutral'
      }
    ];
  }, [headlines, descriptions, sitelinks, callouts]);

  return (
    <div className="p-md space-y-md">
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
                {score}
              </span>
              <span className="text-metadata text-muted-foreground">/100</span>
            </div>
            <Badge 
              variant={score >= AD_STRENGTH_THRESHOLDS.good ? "default" : "secondary"}
              className="text-metadata font-medium"
            >
              {strengthLabel}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-xs">
            <Progress 
              value={score} 
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
          <div className="space-y-xs pt-sm border-t border-border">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-body-sm text-foreground">{metric.name}</span>
                <div className="flex items-center gap-xs">
                  <span className={cn(
                    "text-metadata font-medium",
                    metric.status === 'success' && 'text-success',
                    metric.status === 'warning' && 'text-warning',
                    metric.status === 'error' && 'text-destructive',
                    metric.status === 'neutral' && 'text-muted-foreground'
                  )}>
                    {metric.current}/{metric.recommended}
                  </span>
                  {metric.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  {metric.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                  {metric.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-xs pt-sm border-t border-border">
              <p className="text-metadata font-medium text-muted-foreground uppercase tracking-wide">
                Suggestions
              </p>
              <div className="space-y-xs">
                {suggestions.slice(0, 3).map((suggestion, i) => (
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
    </div>
  );
}
