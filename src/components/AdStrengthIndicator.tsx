import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { calculateAdStrength, type AdStrengthResult } from "@/lib/adQualityScore";

interface AdStrengthIndicatorProps {
  headlines: string[];
  descriptions: string[];
  sitelinks: string[];
  callouts: string[];
}

export const AdStrengthIndicator = ({
  headlines,
  descriptions,
  sitelinks,
  callouts,
}: AdStrengthIndicatorProps) => {
  const result: AdStrengthResult = calculateAdStrength(
    headlines,
    descriptions,
    sitelinks,
    callouts
  );

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'excellent':
        return 'bg-purple-500';
      case 'good':
        return 'bg-green-500';
      case 'average':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'excellent':
        return <Badge className="bg-purple-500">🟣 Excellent</Badge>;
      case 'good':
        return <Badge className="bg-green-500">🟢 Good</Badge>;
      case 'average':
        return <Badge className="bg-yellow-500">🟡 Average</Badge>;
      default:
        return <Badge className="bg-red-500">🔴 Poor</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Ad Strength</CardTitle>
          {getStrengthBadge(result.strength)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Score</span>
            <span className="text-muted-foreground">{result.score}/100</span>
          </div>
          <Progress value={result.score} className={getStrengthColor(result.strength)} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Headlines</span>
              <span className="font-medium">{result.breakdown.headlines}/40</span>
            </div>
            <Progress value={(result.breakdown.headlines / 40) * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Descriptions</span>
              <span className="font-medium">{result.breakdown.descriptions}/30</span>
            </div>
            <Progress value={(result.breakdown.descriptions / 30) * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sitelinks</span>
              <span className="font-medium">{result.breakdown.sitelinks}/15</span>
            </div>
            <Progress value={(result.breakdown.sitelinks / 15) * 100} className="h-1" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Callouts</span>
              <span className="font-medium">{result.breakdown.callouts}/15</span>
            </div>
            <Progress value={(result.breakdown.callouts / 15) * 100} className="h-1" />
          </div>
        </div>

        {result.suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-blue-500" />
              <span>Suggestions to Improve</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
