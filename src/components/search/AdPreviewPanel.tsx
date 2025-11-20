import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Lightbulb, AlertTriangle, Sparkles, X } from 'lucide-react';
import { SearchAdPreview } from '@/components/ads/SearchAdPreview';
import { DisplayAdPreview } from '@/components/ads/DisplayAdPreview';
import { calculateAdStrength } from '@/lib/adQualityScore';

interface AdPreviewPanelProps {
  ad: any;
  campaign: any;
  entity: string;
  headlines: string[];
  descriptions: string[];
  sitelinks: any[];
  callouts: string[];
  landingPage: string;
  businessName: string;
  language: string;
  adType: "search" | "display";
  longHeadline?: string;
  shortHeadlines?: string[];
  ctaText?: string;
}

export function AdPreviewPanel(props: AdPreviewPanelProps) {
  const [combinationIndex, setCombinationIndex] = useState(0);
  
  // Calculate ad strength
  const adStrength = useMemo(() => {
    const validHeadlines = props.headlines.filter(h => h.trim());
    const validDescriptions = props.descriptions.filter(d => d.trim());
    const validSitelinks = props.sitelinks.filter(s => s.description?.trim()).map(s => s.description);
    const validCallouts = props.callouts.filter(c => c.trim());
    
    return calculateAdStrength(
      validHeadlines,
      validDescriptions,
      validSitelinks,
      validCallouts
    );
  }, [props.headlines, props.descriptions, props.sitelinks, props.callouts]);
  
  // Generate preview combinations for search ads
  const combinations = useMemo(() => {
    if (props.adType !== "search") return [];
    
    const validHeadlines = props.headlines.filter(h => h.trim());
    const validDescriptions = props.descriptions.filter(d => d.trim());
    
    if (validHeadlines.length === 0 || validDescriptions.length === 0) {
      return [];
    }
    
    const combos = [];
    // Generate up to 10 combinations
    for (let i = 0; i < Math.min(10, validHeadlines.length); i++) {
      combos.push({
        headlines: validHeadlines.slice(i, i + 3).concat(validHeadlines.slice(0, Math.max(0, 3 - (validHeadlines.length - i)))).slice(0, 3),
        descriptions: validDescriptions.slice(i % validDescriptions.length, (i % validDescriptions.length) + 2).concat(validDescriptions.slice(0, Math.max(0, 2 - (validDescriptions.length - (i % validDescriptions.length))))).slice(0, 2)
      });
    }
    return combos;
  }, [props.headlines, props.descriptions, props.adType]);
  
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'average': return 'text-warning';
      default: return 'text-destructive';
    }
  };
  
  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'average': return 'outline';
      default: return 'destructive';
    }
  };
  
  return (
    <div className="h-full overflow-auto p-md bg-muted/30">
      <div className="space-y-md">
        {/* Ad Strength Score */}
        <Card>
          <CardHeader className="pb-sm">
            <CardTitle className="text-body">Ad Strength</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            <div className="flex items-center gap-sm">
              <Progress value={adStrength.score} className="flex-1" />
              <Badge variant={getStrengthBadge(adStrength.strength)}>
                {adStrength.strength.toUpperCase()}
              </Badge>
            </div>
            <p className="text-metadata text-muted-foreground">
              Score: {adStrength.score}/100
            </p>
          </CardContent>
        </Card>
        
        {/* Preview Navigation for Search Ads */}
        {props.adType === "search" && combinations.length > 1 && (
          <div className="flex justify-between items-center">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setCombinationIndex(i => Math.max(0, i - 1))}
              disabled={combinationIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-metadata text-muted-foreground">
              Combination {combinationIndex + 1} of {combinations.length}
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setCombinationIndex(i => Math.min(combinations.length - 1, i + 1))}
              disabled={combinationIndex >= combinations.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Preview */}
        <Card>
          <CardHeader className="pb-sm">
            <CardTitle className="text-body">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {props.adType === "search" ? (
              combinations.length > 0 ? (
                <SearchAdPreview
                  headlines={combinations[combinationIndex]?.headlines || []}
                  descriptions={combinations[combinationIndex]?.descriptions || []}
                  landingPage={props.landingPage || 'https://example.com'}
                  businessName={props.businessName}
                  sitelinks={props.sitelinks.filter(s => s.description)}
                  callouts={props.callouts.filter(c => c.trim())}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-body-sm">Add headlines and descriptions to see preview</p>
                </div>
              )
            ) : (
              <DisplayAdPreview
                businessName={props.businessName}
                longHeadline={props.longHeadline || ''}
                shortHeadlines={props.shortHeadlines}
                descriptions={props.descriptions}
                ctaText={props.ctaText || ''}
                landingPage={props.landingPage || 'https://example.com'}
                language={props.language}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Critical Issues */}
        {adStrength.suggestions.length > 0 && (
          <Alert>
            <AlertDescription>
              <p className="text-body-sm font-medium mb-xs">Suggestions:</p>
              <ul className="list-disc pl-4 space-y-xs text-body-sm">
                {adStrength.suggestions.slice(0, 3).map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Best Practice Hints */}
        <div className="space-y-xs">
          {props.headlines.filter(h => h.trim()).length < 8 && (
            <div className="flex items-start gap-xs p-sm bg-primary/5 border border-primary/20 rounded-lg">
              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-body-sm text-foreground">
                Add {8 - props.headlines.filter(h => h.trim()).length}+ more headlines to reach "Excellent"
              </p>
            </div>
          )}
          
          {props.descriptions.some(d => d.trim() && d.length < 60) && (
            <div className="flex items-start gap-xs p-sm bg-warning/5 border border-warning/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-body-sm text-foreground">
                Some descriptions are short. Use full 90 chars for better performance
              </p>
            </div>
          )}
          
          {props.sitelinks.filter(s => s.description?.trim()).length === 0 && (
            <div className="flex items-start gap-xs p-sm bg-muted/50 border border-border/50 rounded-lg">
              <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-body-sm text-muted-foreground">
                Add sitelinks to increase ad real estate and CTR
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
