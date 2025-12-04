import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Key, 
  BarChart3,
  Wand2,
  Code2,
  Eye
} from "lucide-react";
import { BestPracticeValidator } from "./BestPracticeValidator";
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
  // 10 keywords instead of 5
  const [keywords, setKeywords] = useState<string[]>(Array(10).fill(""));
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

  // DKI Preview - show headline 1 with each keyword substituted
  const dkiPreviews = useMemo(() => {
    if (!dkiEnabledH1 || !headlines[0]) return [];
    
    const h1 = headlines[0];
    const activeKeywords = keywords.filter(k => k.trim().length > 0);
    
    return activeKeywords.map(keyword => ({
      keyword,
      preview: h1.replace(/{KW}/gi, keyword).replace(/{kw}/gi, keyword.toLowerCase()).replace(/{Kw}/gi, keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase())
    }));
  }, [dkiEnabledH1, headlines, keywords]);

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
        if (inHeadlines >= 3) score += 15;
        if (inDescriptions >= 2) score += 15;
        
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
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-3">
        <CardTitle className="text-heading-sm flex items-center gap-sm">
          📊 Best Practice Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="p-md">
        <Tabs defaultValue="validation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validation" className="text-body-sm">
              <Wand2 className="h-4 w-4 mr-xs" />
              Validation
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

          {/* DKI Check with Live Preview */}
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

            {/* DKI Live Preview with Keywords */}
            {dkiEnabledH1 && dkiPreviews.length > 0 && (
              <div className="space-y-sm">
                <Label className="text-body-sm font-medium flex items-center gap-xs">
                  <Eye className="h-4 w-4" />
                  DKI Preview (based on your keywords)
                </Label>
                <div className="grid gap-2">
                  {dkiPreviews.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-sm p-2 bg-muted/30 rounded-md border">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.keyword}
                      </Badge>
                      <span className="text-body-sm text-foreground truncate">
                        {item.preview}
                      </span>
                      <span className={`text-xs ml-auto shrink-0 ${
                        item.preview.length <= 30 ? 'text-success' : 'text-destructive'
                      }`}>
                        {item.preview.length}/30
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dkiEnabledH1 && dkiPreviews.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Add keywords in the Keywords tab to see DKI previews
              </div>
            )}

            {/* DKI Template Editor */}
            {onHeadlinesUpdate && (
              <DKITemplateEditor
                headlines={headlines}
                onUpdate={onHeadlinesUpdate}
              />
            )}
          </TabsContent>

          {/* Keyword Relevance & Quality Score - 10 keywords */}
          <TabsContent value="keywords" className="mt-md space-y-md">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-md bg-muted/50 rounded-md">
              <div className="flex items-center gap-md">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-body-sm font-medium text-muted-foreground">
                    Keyword Quality Score
                  </div>
                  <div className={`text-heading-lg font-bold ${getScoreColor(keywordQualityScore)}`}>
                    {keywordQualityScore}/100
                  </div>
                </div>
              </div>
              <Progress value={keywordQualityScore} className="w-[150px] h-3" />
            </div>

            {/* Keyword Inputs - 10 keywords in 2 columns of 5 */}
            <div className="space-y-sm">
              <Label className="text-body-sm font-medium">
                Target Keywords (up to 10)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {keywords.map((keyword, idx) => (
                  <Input
                    key={idx}
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...keywords];
                      newKeywords[idx] = e.target.value;
                      setKeywords(newKeywords);
                    }}
                    placeholder={`Keyword ${idx + 1}`}
                    className="h-8 text-sm"
                  />
                ))}
              </div>
            </div>

            {/* Keyword Analysis */}
            {keywordAnalysis.length > 0 && (
              <div className="space-y-sm">
                <Label className="text-body-sm font-medium">Keyword Analysis</Label>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                  {keywordAnalysis.map((analysis, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-md border ${getScoreBg(analysis.score)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-body-sm text-foreground">
                          {analysis.keyword}
                        </div>
                        <Badge
                          variant={analysis.score >= 60 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {analysis.score}/100
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-sm text-xs">
                        <div className="flex items-center gap-xs">
                          {analysis.inHeadlines > 0 ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className="text-muted-foreground">
                            {analysis.inHeadlines} headlines
                          </span>
                        </div>
                        <div className="flex items-center gap-xs">
                          {analysis.inDescriptions > 0 ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className="text-muted-foreground">
                            {analysis.inDescriptions} descriptions
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {keywordAnalysis.length === 0 && (
              <div className="flex items-center justify-center py-6 text-center border border-dashed border-border rounded-md">
                <div className="space-y-sm">
                  <Key className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="text-body-sm font-medium text-muted-foreground">
                    Add keywords to analyze
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Enter up to 10 keywords to check their relevance
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
