import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { GeneratedLinksPreview } from "./GeneratedLinksPreview";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { calculateUtmMedium, generateUtmCampaignByPurpose, formatMonthYear2Digit, formatFullMonthYear2Digit, buildUtmUrl } from "@/lib/utmHelpers";
import { ENTITIES } from "@/lib/constants";
import { Plus, Zap, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface UtmBuilderProps {
  onSave?: () => void;
}

export const UtmBuilder = ({ onSave }: UtmBuilderProps) => {
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<'AO' | 'Webinar' | 'Seminar'>('AO');
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [webinarName, setWebinarName] = useState("");
  const [seminarCity, setSeminarCity] = useState("");
  const [deviceType, setDeviceType] = useState<'web' | 'mobile'>('web');
  const [isExtension, setIsExtension] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);

  const createUtmLink = useCreateUtmLink();
  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();

  const platformOptions = platforms.map(p => ({ value: p.name, label: p.name }));
  const entityOptions = ENTITIES.map(e => ({ value: e, label: e }));

  const handleGenerate = () => {
    if (!baseUrl.trim()) {
      toast.error("Please enter a landing page URL");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (selectedEntities.length === 0) {
      toast.error("Please select at least one entity");
      return;
    }

    // Validate purpose-specific fields
    if (purpose === 'AO' && !selectedCampaign) {
      toast.error("Please select a campaign");
      return;
    }

    if (purpose === 'Webinar' && !webinarName.trim()) {
      toast.error("Please enter a webinar name");
      return;
    }

    if (purpose === 'Seminar' && !seminarCity.trim()) {
      toast.error("Please enter a city for the seminar");
      return;
    }

    const links: any[] = [];

    selectedPlatforms.forEach(platform => {
      selectedEntities.forEach(entity => {
        const utmSource = platform.toLowerCase();
        const utmMedium = calculateUtmMedium(platform);
        const utmCampaign = generateUtmCampaignByPurpose(
          purpose,
          selectedCampaign,
          webinarName,
          seminarCity
        );

        let utmContent: string = deviceType;
        if (isExtension && utmCampaign) {
          utmContent = `${utmCampaign}_Extension_${deviceType}`;
        }

        const fullUrl = buildUtmUrl({
          baseUrl,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
        });

        links.push({
          id: crypto.randomUUID(),
          name: `${platform} - ${entity} - ${utmCampaign}`,
          base_url: baseUrl,
          campaign_name: purpose === 'AO' ? selectedCampaign : (purpose === 'Webinar' ? webinarName : `${seminarCity} Seminar`),
          platform,
          link_purpose: purpose,
          entity: [entity],
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          full_url: fullUrl,
          deviceType,
          purpose,
        });
      });
    });

    setGeneratedLinks(links);
    toast.success(`Generated ${links.length} links`);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleSaveLink = async (link: any) => {
    try {
      await createUtmLink.mutateAsync({
        name: link.name,
        base_url: link.base_url,
        campaign_name: link.campaign_name,
        platform: link.platform,
        link_purpose: link.link_purpose,
        entity: link.entity,
        utm_source: link.utm_source,
        utm_medium: link.utm_medium,
        utm_campaign: link.utm_campaign,
        utm_content: link.utm_content,
        full_url: link.full_url,
      });

      toast.success("Link saved!");
      
      // Remove from generated links
      setGeneratedLinks(prev => prev.filter(l => l.id !== link.id));
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClearPreviews = () => {
    setGeneratedLinks([]);
    toast.info("Preview cleared");
  };

  // Calculate preview campaign
  const previewCampaign = generateUtmCampaignByPurpose(
    purpose,
    selectedCampaign,
    webinarName,
    seminarCity
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generate UTM Links</CardTitle>
          <CardDescription>
            Simple UTM link generation with purpose-driven campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Landing Page URL *</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://cfi.trade/..."
            />
          </div>

          {/* Platform Multi-Select */}
          <div className="space-y-2">
            <Label>Channel/Platform *</Label>
            <SimpleMultiSelect
              options={platformOptions}
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
              placeholder="Select platforms"
            />
          </div>

          {/* Entity Multi-Select */}
          <div className="space-y-2">
            <Label>Entity/Country *</Label>
            <SimpleMultiSelect
              options={entityOptions}
              selected={selectedEntities}
              onChange={setSelectedEntities}
              placeholder="Select entities"
            />
          </div>

          {/* Purpose Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
              <SelectTrigger id="purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AO">Always On (AO)</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
                <SelectItem value="Seminar">Seminar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields Based on Purpose */}
          {purpose === 'AO' && (
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign *</Label>
              <div className="flex gap-2">
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger id="campaign" className="flex-1">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.name}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCampaign(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedCampaign && (
                <p className="text-xs text-muted-foreground">
                  utm_campaign: {selectedCampaign.toLowerCase()}_{formatMonthYear2Digit()}
                </p>
              )}
            </div>
          )}

          {purpose === 'Webinar' && (
            <div className="space-y-2">
              <Label htmlFor="webinarName">Webinar Name *</Label>
              <Input
                id="webinarName"
                value={webinarName}
                onChange={(e) => setWebinarName(e.target.value)}
                placeholder="e.g., Investment Basics"
              />
              {webinarName && (
                <p className="text-xs text-muted-foreground">
                  utm_campaign: {webinarName.toLowerCase().replace(/\s+/g, '')}_{formatMonthYear2Digit()}
                </p>
              )}
            </div>
          )}

          {purpose === 'Seminar' && (
            <div className="space-y-2">
              <Label htmlFor="seminarCity">City *</Label>
              <Input
                id="seminarCity"
                value={seminarCity}
                onChange={(e) => setSeminarCity(e.target.value)}
                placeholder="e.g., Amman, Dubai, Lebanon"
              />
              {seminarCity && (
                <p className="text-xs text-muted-foreground">
                  utm_campaign: {seminarCity}Seminar_{formatFullMonthYear2Digit()}
                </p>
              )}
            </div>
          )}

          {/* Device Type */}
          <div className="space-y-2">
            <Label>Device Type *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deviceType === 'web' ? 'default' : 'outline'}
                onClick={() => setDeviceType('web')}
                className="flex-1"
              >
                <Monitor className="mr-2 h-4 w-4" />
                Web
              </Button>
              <Button
                type="button"
                variant={deviceType === 'mobile' ? 'default' : 'outline'}
                onClick={() => setDeviceType('mobile')}
                className="flex-1"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile
              </Button>
            </div>
          </div>

          {/* Extensions */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extensions"
              checked={isExtension}
              onCheckedChange={(checked) => setIsExtension(checked as boolean)}
            />
            <Label htmlFor="extensions" className="cursor-pointer">
              Extensions
            </Label>
            {isExtension && previewCampaign && (
              <span className="text-xs text-muted-foreground ml-2">
                (utm_content: {previewCampaign}_Extension_{deviceType})
              </span>
            )}
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} size="lg" className="w-full">
            <Zap className="mr-2 h-4 w-4" />
            Generate Links
          </Button>
        </CardContent>
      </Card>

      {/* Generated Links Preview */}
      <GeneratedLinksPreview
        links={generatedLinks}
        onCopy={handleCopyLink}
        onSave={handleSaveLink}
        onClear={handleClearPreviews}
      />

      {/* Add Campaign Dialog */}
      <AddCampaignDialog
        open={showAddCampaign}
        onOpenChange={setShowAddCampaign}
      />
    </>
  );
};
