import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Plus, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { buildUtmUrl, validateUtmParameters } from "@/hooks/useUtmValidation";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { SimpleMultiSelect } from "./SimpleMultiSelect";

interface UtmBuilderProps {
  onSave?: () => void;
}

export const UtmBuilder = ({ onSave }: UtmBuilderProps) => {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [entity, setEntity] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [campaignType, setCampaignType] = useState("");
  const [usageContext, setUsageContext] = useState("");
  const [notes, setNotes] = useState("");
  const [fullUrl, setFullUrl] = useState("");

  const createUtmLink = useCreateUtmLink();

  const validation = validateUtmParameters({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent,
    base_url: baseUrl,
  });

  useEffect(() => {
    if (baseUrl && utmSource && utmMedium && utmCampaign) {
      const url = buildUtmUrl({
        base_url: baseUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
      });
      setFullUrl(url);
    } else {
      setFullUrl("");
    }
  }, [baseUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleCopy = () => {
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      toast.success("URL copied to clipboard!");
    }
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a name for this UTM link");
      return;
    }

    await createUtmLink.mutateAsync({
      name: name.trim(),
      base_url: baseUrl,
      full_url: fullUrl,
      utm_source: utmSource.toLowerCase().replace(/\s+/g, "-"),
      utm_medium: utmMedium.toLowerCase().replace(/\s+/g, "-"),
      utm_campaign: utmCampaign.toLowerCase().replace(/\s+/g, "-"),
      utm_term: utmTerm ? utmTerm.toLowerCase().replace(/\s+/g, "-") : undefined,
      utm_content: utmContent ? utmContent.toLowerCase().replace(/\s+/g, "-") : undefined,
      entity: entity.length > 0 ? entity : undefined,
      teams: teams.length > 0 ? teams : undefined,
      campaign_type: campaignType ? (campaignType as any) : undefined,
      usage_context: usageContext || undefined,
      notes: notes || undefined,
      status: "active",
      is_validated: false,
    });

    // Reset form
    setName("");
    setBaseUrl("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmTerm("");
    setUtmContent("");
    setEntity([]);
    setTeams([]);
    setCampaignType("");
    setUsageContext("");
    setNotes("");

    onSave?.();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build UTM Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Link Name *</Label>
              <Input
                id="name"
                placeholder="e.g., UAE Q1 Facebook Lead Gen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL *</Label>
              <Input
                id="baseUrl"
                placeholder="https://cfi.trade/open-account"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utmSource">UTM Source *</Label>
              <Input
                id="utmSource"
                placeholder="e.g., facebook, google, newsletter"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utmMedium">UTM Medium *</Label>
              <Input
                id="utmMedium"
                placeholder="e.g., cpc, email, social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="utmCampaign">UTM Campaign *</Label>
              <Input
                id="utmCampaign"
                placeholder="e.g., q1_2025_uae_lead_gen"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utmTerm">UTM Term (Optional)</Label>
              <Input
                id="utmTerm"
                placeholder="e.g., forex trading"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utmContent">UTM Content (Optional)</Label>
              <Input
                id="utmContent"
                placeholder="e.g., carousel_ad_v2"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Entity</Label>
              <SimpleMultiSelect
                options={ENTITIES.map(e => ({ value: e, label: e }))}
                selected={entity}
                onChange={setEntity}
                placeholder="Select entities..."
              />
            </div>

            <div className="space-y-2">
              <Label>Team</Label>
              <SimpleMultiSelect
                options={TEAMS.map(t => ({ value: t, label: t }))}
                selected={teams}
                onChange={setTeams}
                placeholder="Select teams..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid_search">Paid Search</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageContext">Usage Context</Label>
              <Input
                id="usageContext"
                placeholder="Where will this be used?"
                value={usageContext}
                onChange={(e) => setUsageContext(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this UTM link..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {validation.errors.length > 0 && (
            <div className="space-y-2">
              {validation.errors.map((error, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              {validation.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {fullUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Generated URL
              {validation.isValid && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md break-all font-mono text-sm">
              {fullUrl}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!validation.isValid || !name.trim()} 
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
