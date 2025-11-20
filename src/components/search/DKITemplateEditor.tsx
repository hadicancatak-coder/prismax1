import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Code2, RotateCw, AlertCircle } from "lucide-react";
import { renderDKI, renderDKIBatch } from "@/lib/dkiRenderer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DKITemplateEditorProps {
  headlines: string[];
  onUpdate: (headlines: string[]) => void;
}

export const DKITemplateEditor = ({ headlines, onUpdate }: DKITemplateEditorProps) => {
  const [template, setTemplate] = useState("Trade {KW} With CFI");
  const [testKeywords, setTestKeywords] = useState("forex\nstocks\ncryptocurrency");
  const [currentRotation, setCurrentRotation] = useState(0);

  const keywords = testKeywords.split('\n').filter(k => k.trim().length > 0);
  const results = renderDKIBatch(template, keywords, 30);

  const currentResult = results[currentRotation % results.length];

  const hasIssues = results.some(r => r.usedFallback);

  const applyTemplate = (headlineIndex: number) => {
    const newHeadlines = [...headlines];
    newHeadlines[headlineIndex] = template;
    onUpdate(newHeadlines);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-sm">
          <Code2 className="h-5 w-5 text-primary" />
          Dynamic Keyword Insertion (DKI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-md">
        {/* Template Syntax Guide */}
        <Alert>
          <AlertDescription>
            <div className="space-y-xs">
              <div className="font-medium text-body-sm">Template Syntax:</div>
              <div className="grid grid-cols-2 gap-xs text-metadata">
                <code className="bg-muted px-xs rounded">{"Trade {KW} Now"}</code>
                <span>Title Case (Trade Forex Now)</span>
                <code className="bg-muted px-xs rounded">{"Trade {kw} Now"}</code>
                <span>lowercase (Trade forex Now)</span>
                <code className="bg-muted px-xs rounded">{"Trade {Kw} Now"}</code>
                <span>Capitalized (Trade Forex now)</span>
                <code className="bg-muted px-xs rounded">{"Trade {DEFAULT:CFI}"}</code>
                <span>Fallback if keyword too long</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Template Input */}
        <div className="space-y-sm">
          <Label>Headline Template</Label>
          <Input
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Enter template with {KW}, {kw}, or {Kw}"
            maxLength={30}
          />
          <div className="text-metadata text-muted-foreground">
            {template.length}/30 characters
          </div>
        </div>

        {/* Test Keywords */}
        <div className="space-y-sm">
          <Label>Test Keywords (one per line)</Label>
          <Textarea
            value={testKeywords}
            onChange={(e) => setTestKeywords(e.target.value)}
            placeholder="forex&#10;stocks&#10;cryptocurrency"
            rows={4}
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-sm">
          <div className="flex items-center justify-between">
            <Label>Live Preview</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRotation(currentRotation + 1)}
            >
              <RotateCw className="h-4 w-4 mr-xs" />
              Next Keyword
            </Button>
          </div>
          <div className="border border-border rounded-md p-md space-y-sm">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Keyword: {keywords[currentRotation % keywords.length]}
              </Badge>
              {currentResult?.usedFallback && (
                <Badge variant="destructive" className="text-metadata">
                  <AlertCircle className="h-3 w-3 mr-xs" />
                  Fallback
                </Badge>
              )}
            </div>
            <div className="text-heading-sm font-medium text-foreground">
              {currentResult?.rendered || template}
            </div>
            <div className="text-metadata text-muted-foreground">
              {currentResult?.rendered.length || 0}/30 characters
            </div>
            {currentResult?.fallbackReason && (
              <div className="text-body-sm text-warning">
                ⚠️ {currentResult.fallbackReason}
              </div>
            )}
          </div>
        </div>

        {/* All Results */}
        <div className="space-y-sm">
          <Label>All Rendered Headlines ({results.length})</Label>
          <ScrollArea className="h-[200px] rounded-md border border-border p-sm">
            <div className="space-y-xs">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-sm rounded-md border ${
                    result.usedFallback ? 'bg-warning/10 border-warning/30' : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex-1">
                      <div className="text-body-sm font-medium text-foreground">
                        {result.rendered}
                      </div>
                      <div className="text-metadata text-muted-foreground">
                        Keyword: {keywords[idx]} • {result.rendered.length}/30 chars
                      </div>
                    </div>
                    {result.usedFallback && (
                      <Badge variant="outline" className="text-metadata border-warning text-warning">
                        Fallback
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Apply to Headlines */}
        <div className="space-y-sm">
          <Label>Apply Template to Headline:</Label>
          <div className="grid grid-cols-3 gap-sm">
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(idx)}
              >
                Headline {idx + 1}
              </Button>
            ))}
          </div>
        </div>

        {hasIssues && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some keywords trigger fallback logic. Review and adjust template or use shorter keywords.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
