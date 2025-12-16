import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sitelink {
  description: string;
  link: string;
}

interface SearchPlannerPreviewPanelProps {
  headlines: string[];
  descriptions: string[];
  landingPage: string;
  businessName: string;
  sitelinks: Sitelink[];
  callouts: string[];
}

export function SearchPlannerPreviewPanel({
  headlines,
  descriptions,
  landingPage,
  businessName,
  sitelinks,
  callouts,
}: SearchPlannerPreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);
  
  // Generate combinations internally
  const combinations = useMemo(() => {
    const validHeadlines = headlines.filter(h => h?.trim());
    const validDescriptions = descriptions.filter(d => d?.trim());
    
    if (validHeadlines.length === 0) {
      return [{
        headlines: [],
        descriptions: validDescriptions.slice(0, 2)
      }];
    }
    
    const getRandomElements = (arr: string[], count: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, arr.length));
    };
    
    const result = [];
    const maxCombinations = Math.min(10, Math.max(1, validHeadlines.length));
    
    for (let i = 0; i < maxCombinations; i++) {
      const comboHeadlines = getRandomElements(validHeadlines, 3);
      const comboDescriptions = getRandomElements(validDescriptions, 2);
      result.push({ headlines: comboHeadlines, descriptions: comboDescriptions });
    }
    
    return result;
  }, [headlines, descriptions]);

  const currentCombination = combinations[currentCombinationIndex] || {
    headlines: headlines.filter(h => h?.trim()).slice(0, 3),
    descriptions: descriptions.filter(d => d?.trim()).slice(0, 2),
  };

  const validSitelinks = sitelinks.filter(s => s?.description?.trim() || s?.link?.trim());
  const validCallouts = callouts.filter(c => c?.trim());

  // Format URL for display
  const displayUrl = landingPage 
    ? landingPage.replace(/^https?:\/\//, '').split('/')[0]
    : 'example.com';

  const handlePrevious = () => {
    setCurrentCombinationIndex(prev => 
      prev === 0 ? combinations.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentCombinationIndex(prev => 
      (prev + 1) % combinations.length
    );
  };

  return (
    <div className="p-md">
      <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-md pb-sm border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <CardTitle className="text-body-sm font-semibold text-foreground flex items-center gap-xs">
              <Globe className="h-4 w-4 text-primary" />
              Live Preview
            </CardTitle>
            
            {/* Device Toggle */}
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'desktop' | 'mobile')}>
              <TabsList className="h-8 bg-muted p-xs">
                <TabsTrigger 
                  value="desktop" 
                  className="h-6 px-sm text-metadata data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger 
                  value="mobile" 
                  className="h-6 px-sm text-metadata data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Combination Navigation */}
          {combinations.length > 1 && (
            <div className="flex items-center justify-between mt-sm">
              <Badge variant="outline" className="text-metadata">
                Combination {currentCombinationIndex + 1}/{combinations.length}
              </Badge>
              <div className="flex items-center gap-xs">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handlePrevious}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNext}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-md">
          {/* Google Ad Preview */}
          <div className={cn(
            "bg-background border border-border rounded-lg p-md transition-smooth",
            previewMode === 'mobile' && "max-w-[320px] mx-auto"
          )}>
            {/* Ad Label */}
            <div className="flex items-center gap-xs mb-xs">
              <Badge 
                variant="outline" 
                className="text-[10px] px-xs py-0 rounded-sm bg-transparent border-muted-foreground/40 text-muted-foreground font-normal"
              >
                Ad
              </Badge>
              <span className="text-metadata text-muted-foreground">·</span>
              <span className="text-metadata text-foreground">{displayUrl}</span>
            </div>

            {/* Headlines */}
            <div className="mb-xs">
              <a 
                href="#" 
                className="text-primary hover:underline transition-smooth cursor-pointer"
                onClick={(e) => e.preventDefault()}
              >
                <h3 className={cn(
                  "font-medium leading-tight",
                  previewMode === 'desktop' ? "text-heading-sm" : "text-body"
                )}>
                  {currentCombination.headlines.slice(0, 3).join(' | ') || 'Your Headlines Here'}
                </h3>
              </a>
            </div>

            {/* Descriptions */}
            <div className="mb-sm">
              <p className="text-body-sm text-foreground leading-relaxed">
                {currentCombination.descriptions.join(' ') || 'Your description text will appear here.'}
              </p>
            </div>

            {/* Sitelinks */}
            {validSitelinks.length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-xs pt-sm border-t border-border",
                previewMode === 'mobile' && "flex-col"
              )}>
                {validSitelinks.slice(0, previewMode === 'desktop' ? 4 : 2).map((sitelink, index) => (
                  <a 
                    key={index}
                    href="#"
                    className="text-primary text-body-sm hover:underline transition-smooth"
                    onClick={(e) => e.preventDefault()}
                  >
                    {sitelink.description || sitelink.link}
                  </a>
                ))}
              </div>
            )}

            {/* Callouts */}
            {validCallouts.length > 0 && (
              <div className="flex flex-wrap gap-xs pt-xs text-metadata text-muted-foreground">
                {validCallouts.slice(0, 4).map((callout, index) => (
                  <span key={index}>
                    {callout}
                    {index < validCallouts.length - 1 && index < 3 && ' · '}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview Stats */}
          <div className="mt-md pt-md border-t border-border">
            <div className="grid grid-cols-2 gap-sm">
              <div className="text-center p-sm bg-muted/50 rounded-md">
                <p className="text-heading-sm font-semibold text-foreground">
                  {headlines.filter(h => h?.trim()).length}
                </p>
                <p className="text-metadata text-muted-foreground">Headlines</p>
              </div>
              <div className="text-center p-sm bg-muted/50 rounded-md">
                <p className="text-heading-sm font-semibold text-foreground">
                  {descriptions.filter(d => d?.trim()).length}
                </p>
                <p className="text-metadata text-muted-foreground">Descriptions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
