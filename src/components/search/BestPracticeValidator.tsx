import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, XCircle, Info, Wand2 } from "lucide-react";
import { validateAd, type ValidationIssue } from "@/lib/validationRuleEngine";
import { useEntityAdRules } from "@/hooks/useEntityAdRules";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BestPracticeValidatorProps {
  headlines: string[];
  descriptions: string[];
  entity?: string;
  primaryKeyword?: string;
}

const getSeverityIcon = (severity: ValidationIssue['severity']) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'info':
      return <Info className="h-4 w-4 text-primary" />;
  }
};

const getSeverityColor = (severity: ValidationIssue['severity']) => {
  switch (severity) {
    case 'critical':
    case 'error':
      return 'bg-destructive/15 border-destructive/30';
    case 'warning':
      return 'bg-warning/15 border-warning/30';
    case 'info':
      return 'bg-primary/15 border-primary/30';
  }
};

export const BestPracticeValidator = ({
  headlines,
  descriptions,
  entity,
  primaryKeyword,
}: BestPracticeValidatorProps) => {
  const { rules } = useEntityAdRules(entity);

  const validHeadlines = headlines.filter(h => h.trim().length > 0);
  const validDescriptions = descriptions.filter(d => d.trim().length > 0);

  const result = validateAd(
    validHeadlines,
    validDescriptions,
    primaryKeyword,
    rules || undefined
  );

  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const infos = result.issues.filter(i => i.severity === 'info');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading-md flex items-center gap-sm">
            <Wand2 className="h-5 w-5 text-primary" />
            Best Practice Validation
          </CardTitle>
          <div className="flex items-center gap-md">
            <div className="text-center">
              <div className={`text-heading-lg font-bold ${getScoreColor(result.score)}`}>
                {result.score}
              </div>
              <div className="text-metadata text-muted-foreground">
                {getScoreLabel(result.score)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-md">
        {/* Score Breakdown */}
        <div className="space-y-sm">
          <div className="text-body-sm font-medium text-foreground">Score Breakdown</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-sm">
            <div className="space-y-xs">
              <div className="text-metadata text-muted-foreground">Length</div>
              <Progress value={(result.breakdown.length / 20) * 100} className="h-2" />
              <div className="text-metadata font-medium">{result.breakdown.length}/20</div>
            </div>
            <div className="space-y-xs">
              <div className="text-metadata text-muted-foreground">Keywords</div>
              <Progress value={(result.breakdown.keywords / 20) * 100} className="h-2" />
              <div className="text-metadata font-medium">{result.breakdown.keywords}/20</div>
            </div>
            <div className="space-y-xs">
              <div className="text-metadata text-muted-foreground">CTA</div>
              <Progress value={(result.breakdown.cta / 20) * 100} className="h-2" />
              <div className="text-metadata font-medium">{result.breakdown.cta}/20</div>
            </div>
            <div className="space-y-xs">
              <div className="text-metadata text-muted-foreground">Compliance</div>
              <Progress value={(result.breakdown.compliance / 25) * 100} className="h-2" />
              <div className="text-metadata font-medium">{result.breakdown.compliance}/25</div>
            </div>
            <div className="space-y-xs">
              <div className="text-metadata text-muted-foreground">Style</div>
              <Progress value={(result.breakdown.style / 15) * 100} className="h-2" />
              <div className="text-metadata font-medium">{result.breakdown.style}/15</div>
            </div>
          </div>
        </div>

        {/* Issue Summary Badges */}
        {result.issues.length > 0 && (
          <div className="flex flex-wrap gap-sm">
            {criticalIssues.length > 0 && (
              <Badge variant="destructive">
                {criticalIssues.length} Critical
              </Badge>
            )}
            {errors.length > 0 && (
              <Badge variant="destructive">
                {errors.length} Error{errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="border-warning text-warning">
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
            {infos.length > 0 && (
              <Badge variant="outline" className="border-primary text-primary">
                {infos.length} Tip{infos.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Issues List */}
        {result.issues.length > 0 ? (
          <ScrollArea className="h-[300px] rounded-md border border-border p-sm">
            <div className="space-y-sm">
              {result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-sm p-sm rounded-md border ${getSeverityColor(issue.severity)}`}
                >
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 space-y-xs">
                    <div className="flex items-center justify-between gap-sm">
                      <span className="text-body-sm font-medium text-foreground">
                        {issue.message}
                      </span>
                      <Badge variant="outline" className="text-metadata">
                        {issue.field}
                      </Badge>
                    </div>
                    {issue.suggestion && (
                      <div className="text-body-sm text-muted-foreground">
                        💡 {issue.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-lg text-center">
            <div className="space-y-sm">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <div className="text-body font-medium text-foreground">
                All Clear! 🎉
              </div>
              <div className="text-body-sm text-muted-foreground">
                Your ad follows all best practices
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
