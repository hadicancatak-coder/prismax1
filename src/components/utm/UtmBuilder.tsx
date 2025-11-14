import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Sparkles } from "lucide-react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EnhancedMultiSelect } from "./EnhancedMultiSelect";
import { GeneratedLinksPreview } from "./GeneratedLinksPreview";
import { AddCampaignDialog } from "./AddCampaignDialog";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms, useCreatePlatform } from "@/hooks/useUtmPlatforms";
import { useSystemEntities, useCreateEntity } from "@/hooks/useSystemEntities";
import { useSystemCities } from "@/hooks/useSystemCities";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";
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
  const { data: entities = [] } = useSystemEntities();
  const { data: cities = [] } = useSystemCities();
  
  const createUtmLink = useCreateUtmLink();
  const createPlatform = useCreatePlatform();
  const createEntity = useCreateEntity();

  const platformOptions = platforms.map(p => ({ value: p.name, label: p.name }));
  const entityOptions = entities.map(e => ({ 
    value: e.name, 
    label: e.emoji ? `${e.emoji} ${e.name}` : e.name 
  }));

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
        selectedEntities.forEach((entityName) => {
          const entity = entities.find(e => e.name === entityName);
          const campaignName = campaigns.find(c => c.name === entityName)?.name || entityName;
          const utmCampaign = generateUtmCampaignByPurpose('AO', campaignName);
          
          // Use entity's website_param if available, otherwise fallback to entity name
          const websiteParam = entity?.website_param || entity?.code || entityName.toLowerCase();
          
          const url = buildUtmUrl({
            baseUrl: lpUrl,
            utmSource: platformName.toLowerCase().replace(/\s+/g, ''),
            utmMedium,
            utmCampaign,
            utmContent: deviceType,
            customParams: withExtensions ? { extensions: 'true', entity: websiteParam } : { entity: websiteParam },
          });

          links.push({
            id: crypto.randomUUID(),
            name: `${platformName} - ${entityName}`,
            full_url: url,
            utm_campaign: utmCampaign,
            platform: platformName,
            entity: [entityName],
            deviceType,
            purpose: 'AO',
            websiteParam,
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
      <div className="mb-4 rounded-lg border border-warning/50 bg-warning/10 p-4">
        <p className="text-sm text-foreground">
          ⚠️ <strong>Link Accuracy Responsibility:</strong> You are responsible for ensuring all UTM links are correct before use. Always verify the final URL matches your campaign requirements. Use{' '}
          <a 
            href="https://docs.google.com/spreadsheets/d/1Desiq_cUDzdypT-Y54EUkKDWDj2ZJyQm0mHLpxhBFJs/edit?gid=1805871355#gid=1805871355"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            this Google Sheet table
          </a>{' '}
          for reference.
        </p>
      </div>
      
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
                <EnhancedMultiSelect
                  options={platformOptions}
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                  placeholder="Select platforms..."
                  allowCustom={true}
                  customPlaceholder="Add new platform"
                  onAddCustom={async (name) => {
                    await createPlatform.mutateAsync({ name, is_active: true });
                  }}
                />
              </div>

              {detection.purpose === 'AO' && (
                <div className="space-y-2">
                  <Label>Entities (Countries) *</Label>
                  <EnhancedMultiSelect
                    options={entityOptions}
                    selected={selectedEntities}
                    onChange={setSelectedEntities}
                    placeholder="Select entities..."
                    allowCustom={true}
                    customPlaceholder="Add new entity"
                    onAddCustom={async (name) => {
                      const code = name.toLowerCase().replace(/\s+/g, '_');
                      await createEntity.mutateAsync({ 
                        name, 
                        code, 
                        is_active: true,
                        display_order: entities.length,
                        emoji: null
                      });
                    }}
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
                  <Select value={city || undefined} onValueChange={setCity}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name} {c.country && `(${c.country})`}
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

              {/* Only show for AO campaigns */}
              {detection?.purpose === 'AO' && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddCampaign(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Campaign
                </Button>
              )}
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
