import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Sparkles } from "lucide-react";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { GeneratedLinksPreview } from "./GeneratedLinksPreview";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";
import { ENTITIES } from "@/lib/constants";
import { detectLPMetadata } from "@/lib/lpDetector";
import { LPDetectionCard } from "./LPDetectionCard";
import { buildUtmUrl, generateUtmCampaignByPurpose, calculateUtmMedium } from "@/lib/utmHelpers";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UtmBuilder() {
  const [lpUrl, setLpUrl] = useState("");
  const [detection, setDetection] = useState<ReturnType<typeof detectLPMetadata> | null>(null);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [webinarName, setWebinarName] = useState("");
  const [city, setCity] = useState("");
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile">("desktop");
  const [withExtensions, setWithExtensions] = useState(false);
  
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
  const [showAddCampaign, setShowAddCampaign] = useState(false);

  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();
  const createUtmLink = useCreateUtmLink();

  const CITIES = [
    "Amman", "Dubai", "Abu Dhabi", "Beirut", "Kuwait City", 
    "Baghdad", "London", "Lagos", "Doha", "Mumbai", 
    "Johannesburg", "Cairo", "Kuala Lumpur", "Santiago", "Hanoi"
  ];

  const platformOptions = platforms.map(p => ({ value: p.name, label: p.name }));
  const entityOptions = ENTITIES.map(e => ({ value: e, label: e }));

  const handleLpChange = (value: string) => {
    setLpUrl(value);
    
    if (value.trim()) {
      const detected = detectLPMetadata(value);
      setDetection(detected);
      
      if (detected.purpose === 'Webinar' && detected.extractedWebinarName) {
        setWebinarName(detected.extractedWebinarName);
      }
      if (detected.purpose === 'Seminar' && detected.extractedCity) {
        setCity(detected.extractedCity);
      }
    } else {
      setDetection(null);
    }
  };

  const handleGenerate = () => {
    if (!lpUrl.trim()) {
      toast.error("Please enter a landing page URL");
      return;
    }

    if (!detection) {
      toast.error("LP metadata could not be detected");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (detection.purpose === 'AO' && selectedEntities.length === 0) {
      toast.error("Please select at least one entity for AO campaigns");
      return;
    }

    if (detection.purpose === 'Webinar' && !webinarName.trim()) {
      toast.error("Please enter a webinar name");
      return;
    }

    if (detection.purpose === 'Seminar' && !city.trim()) {
      toast.error("Please select a city for the seminar");
      return;
    }

    const links: any[] = [];
    const purpose = detection.purpose!;

    selectedPlatforms.forEach((platformName) => {
      const utmMedium = calculateUtmMedium(platformName);
      
      if (purpose === 'AO') {
        selectedEntities.forEach((entity) => {
          const campaignName = campaigns.find(c => c.name === entity)?.name || entity;
          const utmCampaign = generateUtmCampaignByPurpose('AO', campaignName);
          
          const url = buildUtmUrl({
            baseUrl: lpUrl,
            utmSource: platformName.toLowerCase().replace(/\s+/g, ''),
            utmMedium,
            utmCampaign,
            utmContent: deviceType,
            customParams: withExtensions ? { extensions: 'true' } : undefined,
          });

          links.push({
            id: crypto.randomUUID(),
            name: `${platformName} - ${entity}`,
            full_url: url,
            utm_campaign: utmCampaign,
            platform: platformName,
            entity: [entity],
            deviceType,
            purpose: 'AO',
          });
        });
      } else if (purpose === 'Webinar') {
        const utmCampaign = generateUtmCampaignByPurpose('Webinar', undefined, webinarName);
        
        const url = buildUtmUrl({
          baseUrl: lpUrl,
          utmSource: platformName.toLowerCase().replace(/\s+/g, ''),
          utmMedium,
          utmCampaign,
          utmContent: deviceType,
        });

        links.push({
          id: crypto.randomUUID(),
          name: `${platformName} - ${webinarName}`,
          full_url: url,
          utm_campaign: utmCampaign,
          platform: platformName,
          entity: [detection.country || 'Global'],
          deviceType,
          purpose: 'Webinar',
        });
      } else if (purpose === 'Seminar') {
        const utmCampaign = generateUtmCampaignByPurpose('Seminar', undefined, undefined, city);
        
        const url = buildUtmUrl({
          baseUrl: lpUrl,
          utmSource: platformName.toLowerCase().replace(/\s+/g, ''),
          utmMedium,
          utmCampaign,
          utmContent: deviceType,
        });

        links.push({
          id: crypto.randomUUID(),
          name: `${platformName} - ${city} Seminar`,
          full_url: url,
          utm_campaign: utmCampaign,
          platform: platformName,
          entity: [detection.country || city],
          deviceType,
          purpose: 'Seminar',
        });
      }
    });

    setGeneratedLinks(links);
    toast.success(`Generated ${links.length} link${links.length > 1 ? 's' : ''}`);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleSaveLink = async (link: any) => {
    try {
      await createUtmLink.mutateAsync({
        name: link.name,
        full_url: link.full_url,
        base_url: lpUrl,
        utm_source: link.platform.toLowerCase(),
        utm_medium: calculateUtmMedium(link.platform),
        utm_campaign: link.utm_campaign,
        utm_content: link.deviceType,
        platform: link.platform,
        entity: link.entity,
        link_purpose: link.purpose,
      });
      
      toast.success("Link saved!");
      setGeneratedLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClearPreviews = () => {
    setGeneratedLinks([]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart UTM Builder
          </CardTitle>
          <CardDescription>
            Enter a landing page URL and let AI detect the campaign details automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lp-url">Landing Page URL</Label>
            <Input
              id="lp-url"
              type="url"
              placeholder="https://cfi.trade/ar/seminar/amman"
              value={lpUrl}
              onChange={(e) => handleLpChange(e.target.value)}
            />
          </div>

          {detection && <LPDetectionCard detection={detection} />}

          {detection && detection.purpose && (
            <>
              <div className="space-y-2">
                <Label>Platforms *</Label>
                <SimpleMultiSelect
                  options={platformOptions}
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                  placeholder="Select platforms..."
                />
              </div>

              {detection.purpose === 'AO' && (
                <div className="space-y-2">
                  <Label>Entities (Countries) *</Label>
                  <SimpleMultiSelect
                    options={entityOptions}
                    selected={selectedEntities}
                    onChange={setSelectedEntities}
                    placeholder="Select entities..."
                  />
                </div>
              )}

              {detection.purpose === 'Webinar' && (
                <div className="space-y-2">
                  <Label htmlFor="webinar-name">Webinar Name *</Label>
                  <Input
                    id="webinar-name"
                    placeholder="e.g., Trading Basics"
                    value={webinarName}
                    onChange={(e) => setWebinarName(e.target.value)}
                  />
                </div>
              )}

              {detection.purpose === 'Seminar' && (
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((cityName) => (
                        <SelectItem key={cityName} value={cityName}>
                          {cityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Device Type</Label>
                <ToggleGroup
                  type="single"
                  value={deviceType}
                  onValueChange={(value) => value && setDeviceType(value as "desktop" | "mobile")}
                >
                  <ToggleGroupItem value="desktop">Desktop</ToggleGroupItem>
                  <ToggleGroupItem value="mobile">Mobile</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {detection.purpose === 'AO' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extensions"
                    checked={withExtensions}
                    onCheckedChange={(checked) => setWithExtensions(checked as boolean)}
                  />
                  <Label htmlFor="extensions" className="cursor-pointer">
                    Include Extensions Parameter
                  </Label>
                </div>
              )}

              <Button onClick={handleGenerate} className="w-full" size="lg">
                Generate UTM Links
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={() => setShowAddCampaign(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Campaign
          </Button>
        </CardContent>
      </Card>

      <GeneratedLinksPreview
        links={generatedLinks}
        onCopy={handleCopyLink}
        onSave={handleSaveLink}
        onClear={handleClearPreviews}
      />

      <AddCampaignDialog
        open={showAddCampaign}
        onOpenChange={setShowAddCampaign}
      />
    </>
  );
}
