import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdStrengthIndicator } from "@/components/AdStrengthIndicator";
import { AdComplianceChecker } from "@/components/AdComplianceChecker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface QualityMetricsPanelProps {
  adStrength?: number;
  headlines: Array<{ text: string }>;
  descriptions: Array<{ text: string }>;
  sitelinks?: any[];
  callouts?: any[];
  finalUrl?: string;
  businessName?: string;
}

export function QualityMetricsPanel({
  adStrength = 5,
  headlines,
  descriptions,
  sitelinks = [],
  callouts = [],
  finalUrl = '',
  businessName = ''
}: QualityMetricsPanelProps) {
  const [complianceOpen, setComplianceOpen] = useState(false);

  // Calculate ad strength suggestions
  const getSuggestions = () => {
    const suggestions: string[] = [];
    
    if (headlines.length < 15) {
      suggestions.push(`Add ${15 - headlines.length} more headlines for better coverage`);
    }
    if (descriptions.length < 4) {
      suggestions.push(`Add ${4 - descriptions.length} more descriptions`);
    }
    if (sitelinks.length < 4) {
      suggestions.push('Add more sitelinks to improve ad extensions');
    }
    if (callouts.length < 4) {
      suggestions.push('Add more callouts to highlight key features');
    }
    if (!finalUrl) {
      suggestions.push('Add a final URL to complete the ad');
    }
    
    return suggestions;
  };

  const suggestions = getSuggestions();

  // Check for compliance issues
  const complianceIssues = [
    ...headlines.filter(h => h.text.length > 30).map(h => `Headline too long: "${h.text.substring(0, 30)}..."`),
    ...descriptions.filter(d => d.text.length > 90).map(d => `Description too long: "${d.text.substring(0, 30)}..."`),
  ];

  const hasIssues = complianceIssues.length > 0;

  const getScoreVariant = (score: number) => {
    if (score >= 8) return "default";
    if (score >= 6) return "secondary";
    return "destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Average";
    return "Poor";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Ad Strength Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Ad Strength</CardTitle>
            <Badge variant={getScoreVariant(adStrength)} className="text-xs">
              {getScoreLabel(adStrength)} ({adStrength}/10)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AdStrengthIndicator
            headlines={headlines.map(h => h.text)}
            descriptions={descriptions.map(h => h.text)}
            sitelinks={sitelinks.map((s: any) => s.text || s)}
            callouts={callouts.map((c: any) => c.text || c)}
          />
          
          {suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
              {suggestions.map((suggestion, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  • {suggestion}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Check Card */}
      <Collapsible open={complianceOpen} onOpenChange={setComplianceOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/30 hover:shadow-sm transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Compliance Check</CardTitle>
                  {hasIssues ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasIssues && (
                    <Badge variant="destructive" className="text-xs">
                      {complianceIssues.length} {complianceIssues.length === 1 ? 'issue' : 'issues'}
                    </Badge>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${complianceOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 border-t-0 rounded-t-none">
            <CardContent className="pt-3">
              <AdComplianceChecker
                headlines={headlines.map(h => h.text)}
                descriptions={descriptions.map(d => d.text)}
                sitelinks={sitelinks.map((s: any) => s.text || s)}
                callouts={callouts.map((c: any) => c.text || c)}
                entity={businessName}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
