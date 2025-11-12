import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Zap, Monitor, Smartphone } from "lucide-react";
import { detectLPMetadata } from "@/lib/lpDetector";
import { LPDetectionCard } from "./LPDetectionCard";
import { SimpleMultiSelect } from "./SimpleMultiSelect";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { ENTITIES } from "@/lib/constants";
import { generateUtmCampaignByPurpose, calculateUtmMedium } from "@/lib/utmHelpers";
import { GeneratedLinksPreview } from "./GeneratedLinksPreview";
import { useCreateUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";

export function ReadyLinksBuilder() {
  const [lpUrl, setLpUrl] = useState("");
  const [detection, setDetection] = useState<ReturnType<typeof detectLPMetadata> | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [seminarCity, setSeminarCity] = useState("");
  const [webinarName, setWebinarName] = useState("");
  const [deviceType, setDeviceType] = useState<'web' | 'mobile'>('web');
  const [isExtension, setIsExtension] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);

  const { data: platforms = [] } = useUtmPlatforms();
  const createUtmLink = useCreateUtmLink();

  const handleLpChange = (value: string) => {
    setLpUrl(value);
    
    if (value.trim()) {
      const detected = detectLPMetadata(value);
      setDetection(detected);
      
      // Pre-fill extracted values
      if (detected.extractedCity) {
        setSeminarCity(detected.extractedCity);
      }
      if (detected.extractedWebinarName) {
        setWebinarName(detected.extractedWebinarName);
      }
    } else {
      setDetection(null);
    }
  };

  const handleGenerate = () => {
    if (!lpUrl || !detection) {
      toast.error("Please enter a valid landing page URL");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (detection.purpose === 'AO' && selectedEntities.length === 0) {
      toast.error("Please select at least one entity for AO links");
      return;
    }

    if (detection.purpose === 'Seminar' && !seminarCity) {
      toast.error("Please enter a seminar city");
      return;
    }

    if (detection.purpose === 'Webinar' && !webinarName) {
      toast.error("Please enter a webinar name");
      return;
    }

    const links: any[] = [];

    if (detection.purpose === 'AO') {
      // AO: Generate for each platform × entity combination
      selectedPlatforms.forEach(platform => {
        selectedEntities.forEach(entity => {
          const utmMedium = calculateUtmMedium(platform);
          const utmCampaign = generateUtmCampaignByPurpose('AO', 'ao');
          const utmContent = isExtension 
            ? `ao_Extension_${deviceType}`
            : deviceType;

          const url = new URL(lpUrl);
          url.searchParams.set('utm_source', platform.toLowerCase());
          url.searchParams.set('utm_medium', utmMedium);
          url.searchParams.set('utm_campaign', utmCampaign);
          url.searchParams.set('utm_content', utmContent);

          links.push({
            full_url: url.toString(),
            base_url: lpUrl,
            utm_source: platform.toLowerCase(),
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: utmContent,
            platform,
            entity,
            link_purpose: 'AO',
            device_type: deviceType,
          });
        });
      });
    } else if (detection.purpose === 'Webinar') {
      // Webinar: Generate for each platform
      selectedPlatforms.forEach(platform => {
        const utmMedium = calculateUtmMedium(platform);
        const utmCampaign = generateUtmCampaignByPurpose('Webinar', undefined, webinarName);
        const utmContent = isExtension 
          ? `${webinarName.toLowerCase().replace(/\s+/g, '')}_Extension_${deviceType}`
          : deviceType;

        const url = new URL(lpUrl);
        url.searchParams.set('utm_source', platform.toLowerCase());
        url.searchParams.set('utm_medium', utmMedium);
        url.searchParams.set('utm_campaign', utmCampaign);
        url.searchParams.set('utm_content', utmContent);

        links.push({
          full_url: url.toString(),
          base_url: lpUrl,
          utm_source: platform.toLowerCase(),
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          platform,
          entity: detection.country || 'Global',
          link_purpose: 'Webinar',
          device_type: deviceType,
          webinar_name: webinarName,
        });
      });
    } else if (detection.purpose === 'Seminar') {
      // Seminar: Generate for each platform
      selectedPlatforms.forEach(platform => {
        const utmMedium = calculateUtmMedium(platform);
        const utmCampaign = generateUtmCampaignByPurpose('Seminar', undefined, undefined, seminarCity);
        const utmContent = isExtension 
          ? `${seminarCity.toLowerCase()}seminar_Extension_${deviceType}`
          : deviceType;

        const url = new URL(lpUrl);
        url.searchParams.set('utm_source', platform.toLowerCase());
        url.searchParams.set('utm_medium', utmMedium);
        url.searchParams.set('utm_campaign', utmCampaign);
        url.searchParams.set('utm_content', utmContent);

        links.push({
          full_url: url.toString(),
          base_url: lpUrl,
          utm_source: platform.toLowerCase(),
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          platform,
          entity: detection.country || seminarCity,
          link_purpose: 'Seminar',
          device_type: deviceType,
          seminar_city: seminarCity,
        });
      });
    }

    setGeneratedLinks(links);
    toast.success(`Generated ${links.length} link${links.length > 1 ? 's' : ''}`);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleSaveLink = (link: any) => {
    createUtmLink.mutate({
      name: `${link.platform} - ${link.utm_campaign}`,
      full_url: link.full_url,
      base_url: link.base_url,
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: link.utm_content,
      utm_term: null,
      platform: link.platform,
      entity: link.entity,
      link_purpose: link.link_purpose,
    });
  };

  const handleClearPreviews = () => {
    setGeneratedLinks([]);
  };

  const platformOptions = platforms.map(p => ({
    value: p.name,
    label: p.name
  }));

  const entityOptions = ENTITIES.map(e => ({
    value: e,
    label: e
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Smart UTM Link Generator</CardTitle>
          <CardDescription>
            Paste a landing page URL and we'll automatically detect the purpose, country, and language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* LP URL Input */}
          <div>
            <Label htmlFor="lp-url">Landing Page URL</Label>
            <Input
              id="lp-url"
              placeholder="https://campaigns.cfifinancial.com/ar/ps/q3-2025-report"
              value={lpUrl}
              onChange={(e) => handleLpChange(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Auto-Detection Display */}
          {detection && (
            <LPDetectionCard detection={detection} />
          )}

          {/* Conditional Fields Based on Purpose */}
          {detection?.purpose && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-4">Configure UTM Parameters</h3>
                
                {/* Platform Selection (Always shown) */}
                <div className="mb-4">
                  <Label>Platform / Channel</Label>
                  <SimpleMultiSelect
                    options={platformOptions}
                    selected={selectedPlatforms}
                    onChange={setSelectedPlatforms}
                    placeholder="Select platforms..."
                  />
                </div>

                {/* AO-Specific Fields */}
                {detection.purpose === 'AO' && (
                  <div className="mb-4">
                    <Label>Entity / Country</Label>
                    <SimpleMultiSelect
                      options={entityOptions}
                      selected={selectedEntities}
                      onChange={setSelectedEntities}
                      placeholder="Select entities..."
                    />
                  </div>
                )}

                {/* Webinar-Specific Fields */}
                {detection.purpose === 'Webinar' && (
                  <div className="mb-4 space-y-4">
                    <div>
                      <Label htmlFor="webinar-name">Webinar Name</Label>
                      <Input
                        id="webinar-name"
                        value={webinarName}
                        onChange={(e) => setWebinarName(e.target.value)}
                        placeholder="e.g., Investment Basics"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        utm_campaign: {webinarName ? `${webinarName.toLowerCase().replace(/\s+/g, '')}_${new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '').toLowerCase()}` : 'webinarname_nov25'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Seminar-Specific Fields */}
                {detection.purpose === 'Seminar' && (
                  <div className="mb-4 space-y-4">
                    <div>
                      <Label htmlFor="seminar-city">Seminar City</Label>
                      <Select value={seminarCity} onValueChange={setSeminarCity}>
                        <SelectTrigger id="seminar-city">
                          <SelectValue placeholder="Select city..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Amman">Amman</SelectItem>
                          <SelectItem value="Dubai">Dubai</SelectItem>
                          <SelectItem value="AD">Abu Dhabi (AD)</SelectItem>
                          <SelectItem value="Lebanon">Lebanon</SelectItem>
                          <SelectItem value="Kuwait">Kuwait</SelectItem>
                          <SelectItem value="Qatar">Qatar</SelectItem>
                          <SelectItem value="Bahrain">Bahrain</SelectItem>
                          <SelectItem value="Palestine">Palestine</SelectItem>
                          <SelectItem value="Aqaba">Aqaba</SelectItem>
                          <SelectItem value="SA">Saudi Arabia (SA)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        utm_campaign: {seminarCity ? generateUtmCampaignByPurpose('Seminar', undefined, undefined, seminarCity) : 'CitySeminar_November25'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Device Type (Always shown) */}
                <div className="mb-4">
                  <Label>Device Type</Label>
                  <div className="flex gap-2 mt-2">
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

                {/* Extensions Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extensions"
                    checked={isExtension}
                    onCheckedChange={(checked) => setIsExtension(!!checked)}
                  />
                  <Label htmlFor="extensions" className="cursor-pointer">
                    Extensions (adds "_Extension_" to utm_content)
                  </Label>
                </div>
              </div>

              {/* Generate Button */}
              <Button onClick={handleGenerate} size="lg" className="w-full">
                <Zap className="mr-2 h-4 w-4" />
                Generate Links
              </Button>
            </>
          )}

          {/* Info Alert */}
          {!detection && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Enter a landing page URL above to automatically detect the purpose, country, and language.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Links Preview */}
      <GeneratedLinksPreview
        links={generatedLinks}
        onCopy={handleCopyLink}
        onSave={handleSaveLink}
        onClear={handleClearPreviews}
      />
    </div>
  );
}
