import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmLanguages } from "@/hooks/useUtmLanguages";
import { calculateUtmMedium, generateUtmCampaign, formatMonthYearReadable, buildUtmUrl } from "@/lib/utmHelpers";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { Copy, Save, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UtmBuilderProps {
  onSave?: () => void;
}

const LINK_PURPOSES = [
  { value: "AO", label: "AO" },
  { value: "Seminar", label: "Seminar" },
  { value: "Webinar", label: "Webinar" },
  { value: "Education", label: "Education" },
];

export const UtmBuilder = ({ onSave }: UtmBuilderProps) => {
  const [linkName, setLinkName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  
  const [autoUtmSource, setAutoUtmSource] = useState("");
  const [autoUtmMedium, setAutoUtmMedium] = useState("");
  const [autoUtmCampaign, setAutoUtmCampaign] = useState("");
  const [autoMonthYear, setAutoMonthYear] = useState("");
  const [fullUrl, setFullUrl] = useState("");

  const createUtmLink = useCreateUtmLink();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useUtmCampaigns();
  const { data: platforms = [], isLoading: loadingPlatforms } = useUtmPlatforms();
  const { data: languages = [], isLoading: loadingLanguages } = useUtmLanguages();

  // Auto-calculate UTM parameters whenever dependencies change
  useEffect(() => {
    if (selectedPlatform) {
      setAutoUtmSource(selectedPlatform.toLowerCase());
      setAutoUtmMedium(calculateUtmMedium(selectedPlatform));
    }

    if (selectedCampaign && selectedLanguage) {
      const campaign = generateUtmCampaign(selectedCampaign, selectedLanguage);
      setAutoUtmCampaign(campaign);
    }

    setAutoMonthYear(formatMonthYearReadable());
  }, [selectedCampaign, selectedPlatform, selectedLanguage]);

  // Build full URL whenever parameters change
  useEffect(() => {
    if (baseUrl && autoUtmSource && autoUtmMedium && autoUtmCampaign) {
      const url = buildUtmUrl({
        baseUrl,
        utmSource: autoUtmSource,
        utmMedium: autoUtmMedium,
        utmCampaign: autoUtmCampaign,
        utmContent: utmContent || undefined,
        utmTerm: utmTerm || undefined,
      });
      setFullUrl(url);
    } else {
      setFullUrl("");
    }
  }, [baseUrl, autoUtmSource, autoUtmMedium, autoUtmCampaign, utmContent, utmTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("URL copied to clipboard!");
  };

  const handleSave = async () => {
    if (!linkName.trim()) {
      toast.error("Please enter a link name");
      return;
    }

    if (!baseUrl.trim()) {
      toast.error("Please enter a base URL");
      return;
    }

    if (!selectedCampaign) {
      toast.error("Please select a campaign");
      return;
    }

    if (!selectedPlatform) {
      toast.error("Please select a platform");
      return;
    }

    if (!selectedLanguage) {
      toast.error("Please select a language");
      return;
    }

    if (!selectedPurpose) {
      toast.error("Please select a link purpose");
      return;
    }

    if (selectedEntities.length === 0) {
      toast.error("Please select at least one entity");
      return;
    }

    if (selectedTeams.length === 0) {
      toast.error("Please select at least one team");
      return;
    }

    try {
      await createUtmLink.mutateAsync({
        name: linkName.trim(),
        base_url: baseUrl.trim(),
        full_url: fullUrl,
        campaign_name: selectedCampaign,
        platform: selectedPlatform,
        language: selectedLanguage,
        link_purpose: selectedPurpose as any,
        month_year: autoMonthYear,
        utm_source: autoUtmSource,
        utm_medium: autoUtmMedium,
        utm_campaign: autoUtmCampaign,
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
        entity: selectedEntities,
        teams: selectedTeams,
        notes: notes || null,
      });

      // Reset form
      setLinkName("");
      setBaseUrl("");
      setSelectedCampaign("");
      setSelectedPlatform("");
      setSelectedLanguage("");
      setSelectedPurpose("");
      setSelectedEntities([]);
      setSelectedTeams([]);
      setUtmContent("");
      setUtmTerm("");
      setNotes("");

      if (onSave) onSave();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isFormValid = linkName && baseUrl && selectedCampaign && selectedPlatform && 
    selectedLanguage && selectedPurpose && selectedEntities.length > 0 && selectedTeams.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>UTM Link Builder</CardTitle>
          <CardDescription>
            Create UTM-tagged links with auto-generated parameters based on GA4 standards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Link Name */}
          <div className="space-y-2">
            <Label htmlFor="link-name">Link Name *</Label>
            <Input
              id="link-name"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="e.g., Gold Facebook AR October"
            />
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL *</Label>
            <Input
              id="base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://cfi.trade/open-account"
            />
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Campaign *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCampaign(true)}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Campaign
              </Button>
            </div>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign..." />
              </SelectTrigger>
              <SelectContent>
                {loadingCampaigns ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.name}>
                      {campaign.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Platform & Language Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingPlatforms ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language *</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingLanguages ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    languages.map((language) => (
                      <SelectItem key={language.id} value={language.code}>
                        {language.name} ({language.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link Purpose */}
          <div className="space-y-2">
            <Label>Link Purpose *</Label>
            <div className="flex gap-2">
              {LINK_PURPOSES.map((purpose) => (
                <Button
                  key={purpose.value}
                  type="button"
                  variant={selectedPurpose === purpose.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPurpose(purpose.value)}
                >
                  {purpose.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <Label>Entities *</Label>
            <SimpleMultiSelect
              options={ENTITIES.map(e => ({ value: e, label: e }))}
              selected={selectedEntities}
              onChange={setSelectedEntities}
              placeholder="Select entities..."
            />
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label>Teams *</Label>
            <SimpleMultiSelect
              options={TEAMS.map(t => ({ value: t, label: t }))}
              selected={selectedTeams}
              onChange={setSelectedTeams}
              placeholder="Select teams..."
            />
          </div>

          {/* Optional UTM Parameters */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Optional Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utm-content">UTM Content</Label>
                <Input
                  id="utm-content"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="e.g., carousel_ad_v2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utm-term">UTM Term</Label>
                <Input
                  id="utm-term"
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  placeholder="e.g., gold+trading"
                />
              </div>
            </div>
          </div>

          {/* Auto-Generated Parameters */}
          {(autoUtmSource || autoUtmMedium || autoUtmCampaign) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Auto-Generated UTM Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {autoUtmSource && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">utm_source:</span>
                    <div className="font-mono bg-muted px-2 py-1 rounded">{autoUtmSource}</div>
                  </div>
                )}
                {autoUtmMedium && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">utm_medium:</span>
                    <div className="font-mono bg-muted px-2 py-1 rounded">{autoUtmMedium}</div>
                  </div>
                )}
                {autoUtmCampaign && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">utm_campaign:</span>
                    <div className="font-mono bg-muted px-2 py-1 rounded">{autoUtmCampaign}</div>
                  </div>
                )}
                {autoMonthYear && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Month/Year:</span>
                    <div className="font-mono bg-muted px-2 py-1 rounded">{autoMonthYear}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this UTM link..."
              rows={3}
            />
          </div>

          {/* Validation Warning */}
          {!isFormValid && (linkName || baseUrl || selectedCampaign || selectedPlatform) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fill in all required fields (marked with *)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated URL Preview */}
      {fullUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Generated URL</CardTitle>
            <CardDescription>Your complete UTM-tagged link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
              {fullUrl}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!isFormValid || createUtmLink.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddCampaignDialog open={showAddCampaign} onOpenChange={setShowAddCampaign} />
    </>
  );
};
