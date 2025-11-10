import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ChevronLeft, Copy, BookmarkPlus, Download } from "lucide-react";
import { SearchAdPreview } from "@/components/ads/SearchAdPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAdStrength, checkCompliance } from "@/lib/adQualityScore";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedElementsSelector } from "./SavedElementsSelector";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

interface SearchAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
}

export default function SearchAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel }: SearchAdEditorProps) {
  const { user } = useAuth();
  const { copy } = useCopyToClipboard();
  const [name, setName] = useState("");
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [sitelinks, setSitelinks] = useState<{description: string; link: string}[]>(Array(5).fill({description: "", link: ""}));
  const [callouts, setCallouts] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [language, setLanguage] = useState("EN");
  const [isSaving, setIsSaving] = useState(false);

  const createElementMutation = useMutation({
    mutationFn: async (elementData: any) => {
      const { data, error } = await supabase
        .from('ad_elements')
        .insert(elementData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Element saved to library!");
    },
    onError: (error: any) => {
      toast.error("Failed to save element: " + error.message);
    }
  });

  // Auto-calculate ad strength and compliance
  const adStrength = useMemo(() => {
    return calculateAdStrength(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.description.trim()).map(s => s.description),
      callouts.filter(c => c.trim())
    );
  }, [headlines, descriptions, sitelinks, callouts]);

  const complianceIssues = useMemo(() => {
    return checkCompliance(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.description.trim()).map(s => s.description),
      callouts.filter(c => c.trim()),
      entity
    );
  }, [headlines, descriptions, sitelinks, callouts, entity]);

  useEffect(() => {
    if (ad && ad.id) {
      setName(ad.name || "");
      setHeadlines([...(ad.headlines || []), ...Array(15).fill("")].slice(0, 15));
      setDescriptions([...(ad.descriptions || []), ...Array(4).fill("")].slice(0, 4));
      
      // Load sitelinks with backward compatibility
      if (ad.sitelinks && Array.isArray(ad.sitelinks)) {
        const loadedSitelinks = ad.sitelinks.map((s: any) => ({
          description: s.description || s.text || "",
          link: s.link || s.url || ""
        }));
        setSitelinks([
          ...loadedSitelinks,
          ...Array(Math.max(0, 5 - loadedSitelinks.length)).fill({description: "", link: ""})
        ]);
      }
      
      setCallouts([...(ad.callouts || []), ...Array(4).fill("")].slice(0, 4));
      setLandingPage(ad.landing_page || "");
      setBusinessName(ad.business_name || "");
      setLanguage(ad.language || "EN");
    } else {
      setLanguage(campaign?.languages?.[0] || "EN");
    }
  }, [ad, campaign]);

  const updateHeadline = (index: number, value: string) => {
    const newHeadlines = [...headlines];
    newHeadlines[index] = value;
    setHeadlines(newHeadlines);
  };

  const updateDescription = (index: number, value: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    setDescriptions(newDescriptions);
  };

  const updateSitelink = (index: number, field: 'description' | 'link', value: string) => {
    const newSitelinks = [...sitelinks];
    newSitelinks[index] = { ...newSitelinks[index], [field]: value };
    setSitelinks(newSitelinks);
  };

  const updateCallout = (index: number, value: string) => {
    const newCallouts = [...callouts];
    newCallouts[index] = value;
    setCallouts(newCallouts);
  };

  const handleSaveElement = (type: 'headline' | 'description' | 'sitelink' | 'callout', content: string | {description: string; link: string}) => {
    if (!user?.id) {
      toast.error("You must be logged in to save elements");
      return;
    }

    let elementContent = content;
    if (type === 'sitelink' && typeof content === 'object') {
      if (!content.description && !content.link) {
        toast.error("Sitelink must have description or link");
        return;
      }
      elementContent = content;
    } else if (typeof content === 'string' && !content.trim()) {
      toast.error("Cannot save empty element");
      return;
    }

    createElementMutation.mutate({
      element_type: type,
      content: elementContent,
      created_by: user.id,
      entity: entity,
      language: language,
      approval_status: 'approved',
      use_count: 0
    });
  };

  const handleCopyAd = () => {
    const copyData = {
      name: `${name} (Copy)`,
      headlines,
      descriptions,
      sitelinks,
      callouts,
      landingPage,
      businessName,
      language
    };
    
    setName(copyData.name);
    setHeadlines(copyData.headlines);
    setDescriptions(copyData.descriptions);
    setSitelinks(copyData.sitelinks);
    setCallouts(copyData.callouts);
    setLandingPage(copyData.landingPage);
    setBusinessName(copyData.businessName);
    setLanguage(copyData.language);
    
    toast.success("Ad copied! You can now edit and save as a new ad.");
  };

  // Field Actions Component
  interface FieldActionsProps {
    value: string;
    elementType: 'headline' | 'description' | 'sitelink' | 'callout';
    onSelect: (content: string) => void;
    onSave: () => void;
    isEmpty: boolean;
  }

  const FieldActions = ({ value, elementType, onSelect, onSave, isEmpty }: FieldActionsProps) => {
    return (
      <div className="flex gap-1">
        <SavedElementsSelector
          elementType={elementType}
          entity={entity}
          language={language}
          onSelect={onSelect}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Use saved element"
            >
              <Download className="h-4 w-4" />
            </Button>
          }
        />
        
        {!isEmpty && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onSave}
              title="Save to library"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copy(value)}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to create ads");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter an ad name");
      return;
    }

    if (!headlines[0]?.trim()) {
      toast.error("Please enter at least one headline");
      return;
    }

    if (!descriptions[0]?.trim()) {
      toast.error("Please enter at least one description");
      return;
    }

    setIsSaving(true);

    try {
      const adData: any = {
        name,
        created_by: user.id,
        ad_group_id: adGroup.id,
        campaign_name: campaign.name,
        ad_group_name: adGroup.name,
        entity,
        headlines: headlines.filter(h => h.trim()),
        descriptions: descriptions.filter(d => d.trim()),
        sitelinks: sitelinks.filter(s => s.description.trim() || s.link.trim()),
        callouts: callouts.filter(c => c.trim()),
        landing_page: landingPage,
        business_name: businessName,
        language,
        ad_type: "search",
        ad_strength: adStrength.score,
        compliance_issues: complianceIssues.map(issue => ({ ...issue })),
        approval_status: "approved"
      };

      if (ad?.id) {
        const { error } = await supabase
          .from("ads")
          .update(adData)
          .eq("id", ad.id);
        if (error) throw error;
        toast.success("Ad updated successfully");
        onSave(ad.id);
      } else {
        const { data, error } = await supabase
          .from("ads")
          .insert(adData)
          .select()
          .single();
        if (error) throw error;
        toast.success("Ad created successfully");
        onSave(data.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save ad");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="flex h-full">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                {ad?.id ? "Edit Ad" : "Create New Ad"}
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {ad?.id && (
                  <Button variant="outline" size="sm" onClick={handleCopyAd}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Ad
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {entity}
              </Button>
              <span className="text-muted-foreground">›</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {campaign.name}
              </Button>
              <span className="text-muted-foreground">›</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal text-muted-foreground hover:text-primary"
                onClick={onCancel}
              >
                {adGroup.name}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Ad Name *</Label>
              <Input
                id="ad-name"
                placeholder="e.g., Summer Sale - Main Ad"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="AR">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Headlines (15 max, 30 chars each)</Label>
              <div className="grid grid-cols-1 gap-2">
                {headlines.map((headline, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Headline ${index + 1}${index < 3 ? ' *' : ''}`}
                      value={headline}
                      onChange={(e) => updateHeadline(index, e.target.value)}
                      maxLength={30}
                      className="flex-1"
                    />
                    <FieldActions
                      value={headline}
                      elementType="headline"
                      onSelect={(content) => updateHeadline(index, content)}
                      onSave={() => handleSaveElement('headline', headline)}
                      isEmpty={!headline.trim()}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descriptions (4 max, 90 chars each)</Label>
              <div className="grid grid-cols-1 gap-2">
                {descriptions.map((description, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Description ${index + 1}${index < 2 ? ' *' : ''}`}
                      value={description}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      maxLength={90}
                      className="flex-1"
                    />
                    <FieldActions
                      value={description}
                      elementType="description"
                      onSelect={(content) => updateDescription(index, content)}
                      onSave={() => handleSaveElement('description', description)}
                      isEmpty={!description.trim()}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sitelinks (5 max, 25 chars for description)</Label>
              <div className="grid grid-cols-1 gap-2">
                {sitelinks.map((sitelink, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder={`Link description ${index + 1}`}
                        value={sitelink.description}
                        onChange={(e) => updateSitelink(index, 'description', e.target.value)}
                        maxLength={25}
                      />
                      <Input
                        placeholder={`Link URL ${index + 1}`}
                        value={sitelink.link}
                        onChange={(e) => updateSitelink(index, 'link', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <FieldActions
                      value={sitelink.description}
                      elementType="sitelink"
                      onSelect={(content) => updateSitelink(index, 'description', content)}
                      onSave={() => handleSaveElement('sitelink', sitelink)}
                      isEmpty={!sitelink.description.trim() && !sitelink.link.trim()}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Callouts (4 max, 25 chars each)</Label>
              <div className="grid grid-cols-1 gap-2">
                {callouts.map((callout, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Callout ${index + 1} (e.g., "24/7 Support")`}
                      value={callout}
                      onChange={(e) => updateCallout(index, e.target.value)}
                      maxLength={25}
                      className="flex-1"
                    />
                    <FieldActions
                      value={callout}
                      elementType="callout"
                      onSelect={(content) => updateCallout(index, content)}
                      onSave={() => handleSaveElement('callout', callout)}
                      isEmpty={!callout.trim()}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landing-page">Final URL</Label>
              <Input
                id="landing-page"
                type="url"
                placeholder="https://example.com"
                value={landingPage}
                onChange={(e) => setLandingPage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="path1">Path 1 (Max 15 chars)</Label>
                <Input
                  id="path1"
                  placeholder="path1"
                  value={path1}
                  onChange={(e) => setPath1(e.target.value)}
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="path2">Path 2 (Max 15 chars)</Label>
                <Input
                  id="path2"
                  placeholder="path2"
                  value={path2}
                  onChange={(e) => setPath2(e.target.value)}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="Your Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={25}
              />
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving && <span className="mr-2">⏳</span>}
              <Save className="mr-2 h-4 w-4" />
              {ad?.id ? "Update Ad" : "Create Ad"}
            </Button>
          </div>
        </div>
      </ScrollArea>

      <div className="w-[400px] border-l bg-muted/30 p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Live Preview</h3>
          <SearchAdPreview
            headlines={headlines.filter(h => h)}
            descriptions={descriptions.filter(d => d)}
            landingPage={landingPage}
            businessName={businessName}
            sitelinks={sitelinks.filter(s => s.description || s.link)}
            callouts={callouts.filter(c => c)}
          />
        </div>

        {/* Ad Strength - MOVED HERE */}
        <div className="space-y-2 p-4 border rounded-lg bg-background">
          <div className="flex items-center justify-between">
            <Label>Ad Strength</Label>
            <Badge variant={adStrength.strength === 'excellent' ? 'default' : adStrength.strength === 'good' ? 'secondary' : 'outline'}>
              {adStrength.strength.toUpperCase()} ({adStrength.score}/100)
            </Badge>
          </div>
          <Progress value={adStrength.score} className="h-2" />
          {adStrength.suggestions.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              {adStrength.suggestions.slice(0, 3).map((suggestion, i) => (
                <div key={i}>• {suggestion}</div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Issues */}
        {complianceIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-semibold mb-1">Compliance Issues:</div>
              {complianceIssues.map((issue, i) => (
                <div key={i} className="text-sm">• {issue.message}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
