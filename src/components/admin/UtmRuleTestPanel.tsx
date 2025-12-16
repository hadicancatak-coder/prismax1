import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtmRule, UtmRuleEngine, UtmRuleContext } from "@/lib/utmRuleEngine";
import { Play, Copy } from "lucide-react";
import { toast } from "sonner";

interface UtmRuleTestPanelProps {
  rule: UtmRule;
}

export function UtmRuleTestPanel({ rule }: UtmRuleTestPanelProps) {
  const [platform, setPlatform] = useState('google');
  const [campaign, setCampaign] = useState('gold');
  const [lpUrl, setLpUrl] = useState('https://example.com/landing-page/sign-up');
  const [entity, setEntity] = useState('CFI');
  const [result, setResult] = useState<string>('');

  const handleTest = async () => {
    const context: UtmRuleContext = {
      platform,
      campaign,
      lpUrl,
      entity,
      date: new Date(),
    };

    const output = await UtmRuleEngine.testRule(rule, context);
    setResult(output);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Rule: {rule.rule_name}</CardTitle>
        <CardDescription>Test with sample inputs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-platform">Platform</Label>
            <Input
              id="test-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-campaign">Campaign</Label>
            <Input
              id="test-campaign"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="gold"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="test-lp">Landing Page URL</Label>
            <Input
              id="test-lp"
              value={lpUrl}
              onChange={(e) => setLpUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-entity">Entity</Label>
            <Input
              id="test-entity"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              placeholder="CFI"
            />
          </div>
        </div>

        {/* Test Button */}
        <Button onClick={handleTest} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Run Test
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <Label>Result</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex-1 justify-between py-2 px-3 font-mono bg-muted text-foreground">
                <span className="truncate">{result}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  className="ml-2"
                >
                  <Copy />
                </Button>
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
