import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Copy, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchAdPreview } from "../ads/SearchAdPreview";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedElementsSelector } from "./SavedElementsSelector";
import { useCreateAdElement } from "@/hooks/useAdElements";

interface SearchAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
}

export default function SearchAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel }: SearchAdEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const createElementMutation = useCreateAdElement();
  const [name, setName] = useState("");
  const [headlines, setHeadlines] = useState<string[]>(["", "", ""]);
  const [descriptions, setDescriptions] = useState<string[]>(["", ""]);
  const [finalUrl, setFinalUrl] = useState("");
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [language, setLanguage] = useState("EN");
  const [qualityScore, setQualityScore] = useState<number>(5);
  const [complianceScore, setComplianceScore] = useState<number>(5);

  useEffect(() => {
    if (ad && ad.id) {
      setName(ad.name || "");
      setHeadlines(ad.headlines || ["", "", ""]);
      setDescriptions(ad.descriptions || ["", ""]);
      setFinalUrl(ad.final_url || "");
      setPath1(ad.path1 || "");
      setPath2(ad.path2 || "");
      setBusinessName(ad.business_name || "");
      setLanguage(ad.language || campaign.languages?.[0] || "EN");
      setQualityScore(ad.quality_score || 5);
      setComplianceScore(ad.compliance_score || 5);
    } else {
      setLanguage(campaign.languages?.[0] || "EN");
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
        name: name.trim(),
        ad_type: "search",
        entity,
        campaign_id: campaign.id,
        ad_group_id: adGroup.id,
        headlines,
        descriptions,
        final_url: finalUrl,
        path1,
        path2,
        business_name: businessName,
        language,
        approval_status: ad?.approval_status || "draft"
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
    if (!ad?.id) return;

    try {
      const copyData = {
        ...ad,
        name: `${ad.name} (Copy)`,
        approval_status: "draft"
      };
      delete copyData.id;
      delete copyData.created_at;
      delete copyData.updated_at;

      const { data, error } = await supabase
        .from("ads")
        .insert(copyData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Ad copied successfully");
      onSave(data.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to copy ad");
    }
  };

  const handleSaveElement = async (content: string, type: "headline" | "description") => {
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
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Ad Group
              </Button>
              {ad?.id && (
                <Button variant="outline" size="sm" onClick={handleCopyAd}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Ad
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{entity}</span>
              <span>›</span>
              <span>{campaign.name}</span>
              <span>›</span>
              <span>{adGroup.name}</span>
            </div>
            <h2 className="text-2xl font-semibold">
              {ad?.id ? "Edit Ad" : "Create New Ad"}
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ad Details</CardTitle>
              <CardDescription>Configure your search ad settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ad-name">Ad Name *</Label>
                <Input
                  id="ad-name"
                  placeholder="e.g., Promo Ad 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaign.languages?.map((lang: string) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Headlines * (Max 30 characters each)</Label>
                  <SavedElementsSelector
                    elementType="headline"
                    entity={entity}
                    language={language}
                    onSelect={(content) => {
                      const emptyIndex = headlines.findIndex(h => !h.trim());
                      if (emptyIndex !== -1) {
                        updateHeadline(emptyIndex, content);
                      } else {
                        toast.info("All headline slots are filled");
                      }
                    }}
                  />
                </div>
                {headlines.map((headline, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Headline ${index + 1}`}
                      value={headline}
                      onChange={(e) => updateHeadline(index, e.target.value)}
                      maxLength={30}
                      className="flex-1"
                    />
                    {headline.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveElement(headline, "headline")}
                        title="Save to library"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Descriptions * (Max 90 characters each)</Label>
                  <SavedElementsSelector
                    elementType="description"
                    entity={entity}
                    language={language}
                    onSelect={(content) => {
                      const emptyIndex = descriptions.findIndex(d => !d.trim());
                      if (emptyIndex !== -1) {
                        updateDescription(emptyIndex, content);
                      } else {
                        toast.info("All description slots are filled");
                      }
                    }}
                  />
                </div>
                {descriptions.map((description, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Description ${index + 1}`}
                      value={description}
                      onChange={(e) => updateDescription(index, e.target.value)}
                      maxLength={90}
                      className="flex-1"
                    />
                    {description.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveElement(description, "description")}
                        title="Save to library"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="final-url">Final URL</Label>
                <Input
                  id="final-url"
                  type="url"
                  placeholder="https://example.com"
                  value={finalUrl}
                  onChange={(e) => setFinalUrl(e.target.value)}
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
                  placeholder="Your Business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality Score (1-10)</Label>
                  <Input
                    id="quality"
                    type="number"
                    min="1"
                    max="10"
                    value={qualityScore}
                    onChange={(e) => setQualityScore(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compliance">Compliance Score (1-10)</Label>
                  <Input
                    id="compliance"
                    type="number"
                    min="1"
                    max="10"
                    value={complianceScore}
                    onChange={(e) => setComplianceScore(parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {ad?.id ? "Update Ad" : "Create Ad"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="w-96 border-l bg-muted/30 p-6">
        <h3 className="font-semibold mb-4">Live Preview</h3>
        <SearchAdPreview
          headlines={headlines}
          descriptions={descriptions}
          landingPage={finalUrl}
          businessName={businessName}
        />
      </div>
    </div>
  );
}
