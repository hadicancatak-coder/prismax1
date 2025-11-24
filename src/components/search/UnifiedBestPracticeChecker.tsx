import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Key, 
  BarChart3,
  Wand2,
  Users,
  Code2
} from "lucide-react";
import { BestPracticeValidator } from "./BestPracticeValidator";
import { HeadlineDiversityChecker } from "./HeadlineDiversityChecker";
import { DKITemplateEditor } from "./DKITemplateEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnifiedBestPracticeCheckerProps {
  headlines: string[];
  descriptions: string[];
  entity?: string;
  onHeadlinesUpdate?: (headlines: string[]) => void;
  dkiEnabled?: boolean[];
  onDkiToggle?: (index: number, enabled: boolean) => void;
}

interface KeywordAnalysis {
  keyword: string;
  inHeadlines: number;
  inDescriptions: number;
  score: number;
}

export const UnifiedBestPracticeChecker = ({
  headlines,
  descriptions,
  entity,
  onHeadlinesUpdate,
  dkiEnabled = [],
  onDkiToggle
}: UnifiedBestPracticeCheckerProps) => {
  const [keywords, setKeywords] = useState<string[]>(["", "", "", "", ""]);
  const [dkiEnabledH1, setDkiEnabledH1] = useState(false);

  // Handle DKI toggle for Headline 1 only
  const handleDkiToggle = (checked: boolean) => {
    setDkiEnabledH1(checked);
    if (onDkiToggle) {
      onDkiToggle(0, checked);
    }
    
    // Validate: DKI can only be enabled if H1 is ≤30 chars
    if (checked && headlines[0] && headlines[0].length > 30) {
      setDkiEnabledH1(false);
      if (onDkiToggle) {
        onDkiToggle(0, false);
      }
    }
  };

  // Keyword analysis
  const analyzeKeywords = (): KeywordAnalysis[] => {
    return keywords
      .filter(k => k.trim().length > 0)
      .map(keyword => {
        const kw = keyword.toLowerCase();
        const validHeadlines = headlines.filter(h => h.trim().length > 0);
        const validDescriptions = descriptions.filter(d => d.trim().length > 0);
        
        const inHeadlines = validHeadlines.filter(h => 
          h.toLowerCase().includes(kw)
        ).length;
        
        const inDescriptions = validDescriptions.filter(d => 
          d.toLowerCase().includes(kw)
        ).length;
        
        // Quality score: keyword presence and distribution
        let score = 0;
        if (inHeadlines > 0) score += 40;
        if (inDescriptions > 0) score += 30;
        if (inHeadlines >= 3) score += 15; // Good distribution in headlines
        if (inDescriptions >= 2) score += 15; // Good distribution in descriptions
        
        return { keyword, inHeadlines, inDescriptions, score };
      });
  };

  const keywordAnalysis = analyzeKeywords();
  
  // Overall keyword quality score
  const keywordQualityScore = keywordAnalysis.length > 0
    ? Math.round(keywordAnalysis.reduce((sum, a) => sum + a.score, 0) / keywordAnalysis.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/15 border-success/30';
    if (score >= 60) return 'bg-primary/15 border-primary/30';
    if (score >= 40) return 'bg-warning/15 border-warning/30';
    return 'bg-destructive/15 border-destructive/30';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-heading-lg flex items-center gap-sm">
          📊 Best Practice Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="p-md">
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation" className="text-body-sm">
              <Wand2 className="h-4 w-4 mr-xs" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="diversity" className="text-body-sm">
              <Users className="h-4 w-4 mr-xs" />
              Diversity
            </TabsTrigger>
            <TabsTrigger value="dki" className="text-body-sm">
              <Code2 className="h-4 w-4 mr-xs" />
              DKI
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-body-sm">
              <Key className="h-4 w-4 mr-xs" />
              Keywords
            </TabsTrigger>
          </TabsList>

          {/* Best Practice Validation & Scoring */}
          <TabsContent value="validation" className="mt-md">
            <BestPracticeValidator
              headlines={headlines}
              descriptions={descriptions}
              entity={entity}
              primaryKeyword={keywords[0]}
            />
          </TabsContent>

          {/* Headline Diversity Check */}
          <TabsContent value="diversity" className="mt-md">
            <HeadlineDiversityChecker
              headlines={headlines}
              onUpdate={onHeadlinesUpdate}
            />
          </TabsContent>

          {/* DKI Check */}
          <TabsContent value="dki" className="mt-md space-y-md">
            {/* DKI Toggle for H1 */}
            <div className="flex items-center justify-between p-sm bg-muted/50 rounded-md">
              <div className="space-y-xs flex-1">
                <Label className="text-body-sm font-medium">
                  Enable DKI for Headline 1
                </Label>
                <p className="text-metadata text-muted-foreground">
                  Dynamic Keyword Insertion (DKI) will only work if Headline 1 is ≤30 characters
                </p>
              </div>
              <Switch
                checked={dkiEnabledH1}
                onCheckedChange={handleDkiToggle}
                disabled={headlines[0] && headlines[0].length > 30}
              />
            </div>

            {/* DKI Validation Alert */}
            {headlines[0] && headlines[0].length > 30 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Headline 1 is {headlines[0].length} characters. DKI requires ≤30 characters.
                  Please shorten your headline to enable DKI.
                </AlertDescription>
              </Alert>
            )}

            {dkiEnabledH1 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription>
                  DKI enabled for Headline 1. Use {`{KW}`}, {`{kw}`}, or {`{Kw}`} placeholders in your headline.
                </AlertDescription>
              </Alert>
            )}

            {/* DKI Template Editor */}
            {onHeadlinesUpdate && (
              <DKITemplateEditor
                headlines={headlines}
                onUpdate={onHeadlinesUpdate}
              />
            )}
          </TabsContent>

          {/* Keyword Relevance & Quality Score */}
          <TabsContent value="keywords" className="mt-md space-y-md">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-md bg-muted/50 rounded-md">
              <div className="flex items-center gap-md">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-body-sm font-medium text-muted-foreground">
                    Keyword Quality Score
                  </div>
                  <div className={`text-heading-xl font-bold ${getScoreColor(keywordQualityScore)}`}>
                    {keywordQualityScore}/100
                  </div>
                </div>
              </div>
              <Progress value={keywordQualityScore} className="w-[200px] h-3" />
            </div>

            {/* Keyword Inputs */}
            <div className="space-y-sm">
              <Label className="text-body-sm font-medium">
                Top Keywords (up to 5)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {keywords.map((keyword, idx) => (
                  <div key={idx} className="space-y-xs">
                    <Input
                      value={keyword}
                      onChange={(e) => {
                        const newKeywords = [...keywords];
                        newKeywords[idx] = e.target.value;
                        setKeywords(newKeywords);
                      }}
                      placeholder={`Keyword ${idx + 1}`}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Analysis */}
            {keywordAnalysis.length > 0 && (
              <div className="space-y-sm">
                <Label className="text-body-sm font-medium">Keyword Analysis</Label>
                <div className="space-y-sm">
                  {keywordAnalysis.map((analysis, idx) => (
                    <div
                      key={idx}
                      className={`p-sm rounded-md border ${getScoreBg(analysis.score)}`}
                    >
                      <div className="flex items-center justify-between mb-xs">
                        <div className="font-medium text-body-sm text-foreground">
                          {analysis.keyword}
                        </div>
                        <Badge
                          variant={analysis.score >= 60 ? "default" : "destructive"}
                          className="text-metadata"
                        >
                          {analysis.score}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-sm text-metadata">
                        <div className="flex items-center gap-xs">
                          {analysis.inHeadlines > 0 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className="text-muted-foreground">
                            {analysis.inHeadlines} headlines
                          </span>
                        </div>
                        <div className="flex items-center gap-xs">
                          {analysis.inDescriptions > 0 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className="text-muted-foreground">
                            {analysis.inDescriptions} descriptions
                          </span>
                        </div>
                      </div>
                      <Progress value={analysis.score} className="h-1.5 mt-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {keywordAnalysis.length === 0 && (
              <div className="flex items-center justify-center py-lg text-center border border-dashed border-border rounded-md">
                <div className="space-y-sm">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="text-body font-medium text-muted-foreground">
                    Add keywords to analyze
                  </div>
                  <div className="text-body-sm text-muted-foreground">
                    Enter up to 5 keywords to check their relevance in your ad
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
