import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdPreviewPanelProps {
  adStrength?: number;
  complianceIssues?: Array<{ message: string; severity: "error" | "warning" }>;
}

export function AdPreviewPanel({ adStrength = 75, complianceIssues = [] }: AdPreviewPanelProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [currentVariation, setCurrentVariation] = useState(0);
  const totalVariations = 5;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-md border-b border-border">
        <div className="flex items-center justify-between mb-sm">
          <h3 className="text-heading-sm font-semibold">Live Preview</h3>
          <div className="flex items-center gap-xs border border-border rounded-md p-1">
            <Button
              size="icon"
              variant={deviceView === "desktop" ? "default" : "ghost"}
              onClick={() => setDeviceView("desktop")}
              className="h-7 w-7"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={deviceView === "mobile" ? "default" : "ghost"}
              onClick={() => setDeviceView("mobile")}
              className="h-7 w-7"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Ad Strength */}
        <div className="space-y-xs">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-muted-foreground">Ad Strength:</span>
            <Badge className={adStrength >= 70 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
              {adStrength >= 70 ? "Good" : "Needs Work"}
            </Badge>
          </div>
          <Progress value={adStrength} className="h-2" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-md space-y-md">
          {/* Preview Card */}
          <Card className="card-glow">
            <CardHeader className="pb-sm">
              <div className="flex items-center justify-between">
                <CardTitle className="text-body-sm text-muted-foreground">
                  Variation {currentVariation + 1} of {totalVariations}
                </CardTitle>
                <div className="flex items-center gap-xs">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCurrentVariation(Math.max(0, currentVariation - 1))}
                    disabled={currentVariation === 0}
                    className="h-6 w-6"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setCurrentVariation(Math.min(totalVariations - 1, currentVariation + 1))}
                    disabled={currentVariation === totalVariations - 1}
                    className="h-6 w-6"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock ad preview */}
              <div className="space-y-sm p-md bg-muted/50 rounded-lg">
                <div className="flex items-start gap-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20" />
                  <div className="flex-1 space-y-xs">
                    <p className="text-body-sm text-muted-foreground">Ad · example.com</p>
                    <h4 className="text-body font-semibold text-primary">Best Forex Trading in UAE</h4>
                    <p className="text-body-sm text-foreground">Trade with confidence on our award-winning platform</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Character limits */}
          <Card>
            <CardHeader className="pb-sm">
              <CardTitle className="text-heading-sm">Character Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-sm">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">Headlines:</span>
                <div className="flex items-center gap-xs">
                  <Progress value={75} className="w-16 h-1.5" />
                  <span className="text-metadata font-medium">27/30</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">Descriptions:</span>
                <div className="flex items-center gap-xs">
                  <Progress value={60} className="w-16 h-1.5" />
                  <span className="text-metadata font-medium">54/90</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance checklist */}
          <Card>
            <CardHeader className="pb-sm">
              <CardTitle className="text-heading-sm">Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-sm">
              {complianceIssues.length === 0 ? (
                <div className="flex items-center gap-sm text-body-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span>No issues detected</span>
                </div>
              ) : (
                complianceIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-sm text-body-sm">
                    <AlertCircle className={`h-4 w-4 flex-shrink-0 ${issue.severity === "error" ? "text-destructive" : "text-warning"}`} />
                    <span className={issue.severity === "error" ? "text-destructive" : "text-warning"}>
                      {issue.message}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
