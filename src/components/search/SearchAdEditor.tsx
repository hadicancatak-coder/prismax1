import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Save, ChevronLeft, BookmarkPlus } from "lucide-react";
import { SearchAdPreview } from "@/components/ads/SearchAdPreview";
import { SavedElementsSelector } from "./SavedElementsSelector";
import { useCreateAdElement } from "@/hooks/useAdElements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateAdStrength, checkCompliance } from "@/lib/adQualityScore";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
}

export default function SearchAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel }: SearchAdEditorProps) {
  const [name, setName] = useState("");
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [sitelinks, setSitelinks] = useState<{text: string; url: string}[]>(Array(5).fill({text: "", url: ""}));
  const [callouts, setCallouts] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [language, setLanguage] = useState("EN");
  const [isSaving, setIsSaving] = useState(false);

  const createElementMutation = useCreateAdElement();

  // Auto-calculate ad strength and compliance
  const adStrength = useMemo(() => {
    return calculateAdStrength(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.text.trim()).map(s => s.text),
      callouts.filter(c => c.trim())
    );
  }, [headlines, descriptions, sitelinks, callouts]);

  const complianceIssues = useMemo(() => {
    return checkCompliance(
      headlines.filter(h => h.trim()),
      descriptions.filter(d => d.trim()),
      sitelinks.filter(s => s.text.trim()).map(s => s.text),
      callouts.filter(c => c.trim()),
      entity
    );
  }, [headlines, descriptions, sitelinks, callouts, entity]);

  useEffect(() => {
    if (ad && ad.id) {
      setName(ad.name || "");
      setHeadlines([...(ad.headlines || []), ...Array(15).fill("")].slice(0, 15));
      setDescriptions([...(ad.descriptions || []), ...Array(4).fill("")].slice(0, 4));
      setSitelinks([...(ad.sitelinks || []), ...Array(5).fill({text: "", url: ""})].slice(0, 5));
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

  const updateSitelink = (index: number, field: 'text' | 'url', value: string) => {
    const newSitelinks = [...sitelinks];
    newSitelinks[index] = { ...newSitelinks[index], [field]: value };
    setSitelinks(newSitelinks);
  };

  const updateCallout = (index: number, value: string) => {
    const newCallouts = [...callouts];
    newCallouts[index] = value;
    setCallouts(newCallouts);
  };

  const handleSave = async () => {
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
        ad_group_id: adGroup.id,
        campaign_name: campaign.name,
        ad_group_name: adGroup.name,
        entity,
        headlines: headlines.filter(h => h.trim()),
        descriptions: descriptions.filter(d => d.trim()),
        sitelinks: sitelinks.filter(s => s.text.trim() || s.url.trim()),
        callouts: callouts.filter(c => c.trim()),
        landing_page: landingPage,
        business_name: businessName,
        language,
        ad_type: "search",
        ad_strength: adStrength.score,
        compliance_issues: complianceIssues.map(issue => ({ ...issue })),
        approval_status: "pending"
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

  const handleCopyAd = async () => {
    if (!ad?.id) {
      setName(`${ad.name} (Copy)`);
      setHeadlines([...(ad.headlines || []), ...Array(15).fill("")].slice(0, 15));
      setDescriptions([...(ad.descriptions || []), ...Array(4).fill("")].slice(0, 4));
      setSitelinks([...(ad.sitelinks || []), ...Array(5).fill({text: "", url: ""})].slice(0, 5));
      setCallouts([...(ad.callouts || []), ...Array(4).fill("")].slice(0, 4));
      setLandingPage(ad.landing_page || "");
      setBusinessName(ad.business_name || "");
      setLanguage(ad.language || "EN");
      toast.success("Ad copied to editor. Make changes and save.");
      return;
    }
  };

  const handleSaveElement = async (content: string, type: "headline" | "description" | "sitelink" | "callout") => {
    if (!content.trim()) {
      toast.error("Cannot save empty element");
      return;
    }

    try {
      await createElementMutation.mutateAsync({
        element_type: type,
        content,
        entity: [entity],
        language,
        platform: "ppc",
        google_status: "pending",
        tags: [],
        is_favorite: false
      });
      toast.success(`${type} saved to library`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save element");
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
                {ad?.id && (
                  <Button variant="outline" size="sm" onClick={handleCopyAd}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Ad
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
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

            {/* Ad Strength Display */}
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headlines (15 max, 30 chars each)</Label>
                <SavedElementsSelector
                  elementType="headline"
                  entity={entity}
                  language={language}
                  onSelect={(content) => {
                    const emptyIndex = headlines.findIndex(h => !h);
                    if (emptyIndex !== -1) {
                      updateHeadline(emptyIndex, content);
                    }
                  }}
                />
              </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveElement(headline, "headline")}
                      disabled={!headline.trim() || createElementMutation.isPending}
                      title="Save as reusable element"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descriptions (4 max, 90 chars each)</Label>
                <SavedElementsSelector
                  elementType="description"
                  entity={entity}
                  language={language}
                  onSelect={(content) => {
                    const emptyIndex = descriptions.findIndex(d => !d);
                    if (emptyIndex !== -1) {
                      updateDescription(emptyIndex, content);
                    }
                  }}
                />
              </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveElement(description, "description")}
                      disabled={!description.trim() || createElementMutation.isPending}
                      title="Save as reusable element"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sitelinks (5 max, 25 chars each)</Label>
                <SavedElementsSelector
                  elementType="sitelink"
                  entity={entity}
                  language={language}
                  onSelect={(content) => {
                    const emptyIndex = sitelinks.findIndex(s => !s.text);
                    if (emptyIndex !== -1) {
                      updateSitelink(emptyIndex, 'text', content);
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {sitelinks.map((sitelink, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Sitelink ${index + 1} text`}
                        value={sitelink.text}
                        onChange={(e) => updateSitelink(index, 'text', e.target.value)}
                        maxLength={25}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveElement(sitelink.text, "sitelink")}
                        disabled={!sitelink.text.trim() || createElementMutation.isPending}
                        title="Save as reusable element"
                      >
                        <BookmarkPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder={`Sitelink ${index + 1} URL`}
                      value={sitelink.url}
                      onChange={(e) => updateSitelink(index, 'url', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Callouts (4 max, 25 chars each)</Label>
                <SavedElementsSelector
                  elementType="callout"
                  entity={entity}
                  language={language}
                  onSelect={(content) => {
                    const emptyIndex = callouts.findIndex(c => !c);
                    if (emptyIndex !== -1) {
                      updateCallout(emptyIndex, content);
                    }
                  }}
                />
              </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveElement(callout, "callout")}
                      disabled={!callout.trim() || createElementMutation.isPending}
                      title="Save as reusable element"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
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

      <div className="w-[400px] border-l bg-muted/30 p-6">
        <h3 className="font-semibold mb-4">Live Preview</h3>
        <SearchAdPreview
          headlines={headlines.filter(h => h)}
          descriptions={descriptions.filter(d => d)}
          landingPage={landingPage}
          businessName={businessName}
          sitelinks={sitelinks.filter(s => s.text || s.url)}
          callouts={callouts.filter(c => c)}
        />
      </div>
    </div>
  );
}
