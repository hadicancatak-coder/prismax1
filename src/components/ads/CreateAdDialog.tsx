import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DisplayAdCreator } from "./DisplayAdCreator";
import { ElementQuickInsert } from "./ElementQuickInsert";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Copy, Save } from "lucide-react";
import { useSaveSocialElement } from "@/hooks/useSocialAdElements";

interface CreateAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const AD_ENTITIES = [
  "CFI",
  "Fortrade",
  "Libertex",
  "Plus500",
  "Trade360",
  "Trading212",
  "eToro",
  "XTB",
];

export function CreateAdDialog({ open, onOpenChange, onComplete }: CreateAdDialogProps) {
  const [adType, setAdType] = useState<"search" | "display">("search");
  const [entity, setEntity] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [adGroupName, setAdGroupName] = useState("");
  const [adName, setAdName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { copy } = useCopyToClipboard();
  const saveElementMutation = useSaveSocialElement();

  // Search ad fields
  const [headlines, setHeadlines] = useState<string[]>(Array(15).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(4).fill(""));
  const [landingPage, setLandingPage] = useState("");
  const [sitelinks, setSitelinks] = useState<{ title: string; description: string }[]>(
    Array(4).fill({ title: "", description: "" })
  );
  const [callouts, setCallouts] = useState<string[]>(Array(10).fill(""));

  // Display ad fields
  const [businessName, setBusinessName] = useState("");
  const [longHeadline, setLongHeadline] = useState("");
  const [shortHeadlines, setShortHeadlines] = useState<string[]>(Array(5).fill(""));
  const [displayDescriptions, setDisplayDescriptions] = useState<string[]>(Array(5).fill(""));
  const [ctaText, setCtaText] = useState("");
  const [displayLandingPage, setDisplayLandingPage] = useState("");

  const resetForm = () => {
    setAdType("search");
    setEntity("");
    setCampaignName("");
    setAdGroupName("");
    setAdName("");
    setHeadlines(Array(15).fill(""));
    setDescriptions(Array(4).fill(""));
    setLandingPage("");
    setSitelinks(Array(4).fill({ title: "", description: "" }));
    setCallouts(Array(10).fill(""));
    setBusinessName("");
    setLongHeadline("");
    setShortHeadlines(Array(5).fill(""));
    setDisplayDescriptions(Array(5).fill(""));
    setCtaText("");
    setDisplayLandingPage("");
  };

  const handleSaveAsElement = async (content: string, elementType: 'headline' | 'description' | 'sitelink' | 'callout') => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Cannot save empty text', variant: 'destructive' });
      return;
    }

    try {
      await saveElementMutation.mutateAsync({
        content,
        elementType,
        entity: entity ? [entity] : [],
        language: 'EN',
      });
      
      toast({ title: 'Success', description: `Saved as ${elementType}` });
    } catch (error) {
      console.error('Error saving element:', error);
    }
  };

  const handleCreate = async () => {
    if (!entity || !campaignName || !adGroupName || !adName) {
      toast({
        title: "Missing Information",
        description: "Please fill in entity, campaign name, ad group name, and ad name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const adData: any = {
        name: adName,
        entity,
        campaign_name: campaignName,
        ad_group_name: adGroupName,
        ad_type: adType,
      };

      if (adType === "search") {
        adData.headlines = JSON.stringify(headlines);
        adData.descriptions = JSON.stringify(descriptions);
        adData.landing_page = landingPage;
        adData.sitelinks = JSON.stringify(sitelinks);
        adData.callouts = JSON.stringify(callouts);
      } else {
        adData.business_name = businessName;
        adData.long_headline = longHeadline;
        adData.short_headlines = JSON.stringify(shortHeadlines);
        adData.descriptions = JSON.stringify(displayDescriptions);
        adData.cta_text = ctaText;
        adData.landing_page = displayLandingPage;
      }

      const { data: newAd, error: adError } = await supabase
        .from("ads")
        .insert(adData)
        .select()
        .single();

      if (adError) throw adError;

      // Create initial version (optional - only if ad_versions table supports it)
      try {
        await supabase.from("ad_versions").insert({
          ad_id: newAd.id,
          version_number: 1,
          snapshot_data: adData,
        });
      } catch (versionError) {
        // Silently fail if versions not supported
        console.log('Ad versions not supported:', versionError);
      }

      toast({
        title: "Success",
        description: `${adType === "search" ? "Search" : "Display"} ad created successfully!`,
      });

      resetForm();
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ad</DialogTitle>
          <DialogDescription>
            Choose ad type and fill in the required information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ad Type Selection */}
          <div className="space-y-2">
            <Label>Ad Type</Label>
            <Tabs value={adType} onValueChange={(v) => setAdType(v as "search" | "display")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Search Ad</TabsTrigger>
                <TabsTrigger value="display">Display Ad</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entity *</Label>
              <Select value={entity} onValueChange={setEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {AD_ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ad Name *</Label>
              <Input
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                placeholder="e.g., Q4 Promo Ad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Black Friday 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Ad Group Name *</Label>
              <Input
                value={adGroupName}
                onChange={(e) => setAdGroupName(e.target.value)}
                placeholder="e.g., Signup Offers"
              />
            </div>
          </div>

          {/* Ad Type Specific Fields */}
          {adType === "search" ? (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Search Ad Content</h3>
              
              <div className="space-y-2">
                <Label>Landing Page URL</Label>
                <Input
                  value={landingPage}
                  onChange={(e) => setLandingPage(e.target.value)}
                  placeholder="https://example.com/landing-page"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label>Headlines (up to 15, max 30 chars each)</Label>
                <div className="grid gap-2">
                  {headlines.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={h}
                        onChange={(e) => {
                          const newHeadlines = [...headlines];
                          newHeadlines[i] = e.target.value.slice(0, 30);
                          setHeadlines(newHeadlines);
                        }}
                        placeholder={`Headline ${i + 1}`}
                        maxLength={30}
                        className="flex-1"
                      />
                      <ElementQuickInsert 
                        elementType="headline"
                        onInsert={(content) => {
                          const newHeadlines = [...headlines];
                          newHeadlines[i] = content.slice(0, 30);
                          setHeadlines(newHeadlines);
                        }}
                      />
                      {h && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copy(h, 'Headline copied')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveAsElement(h, 'headline')}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descriptions (up to 4, max 90 chars each)</Label>
                <div className="grid gap-2">
                  {descriptions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={d}
                        onChange={(e) => {
                          const newDescriptions = [...descriptions];
                          newDescriptions[i] = e.target.value.slice(0, 90);
                          setDescriptions(newDescriptions);
                        }}
                        placeholder={`Description ${i + 1}`}
                        maxLength={90}
                        className="flex-1"
                      />
                      <ElementQuickInsert 
                        elementType="description"
                        onInsert={(content) => {
                          const newDescriptions = [...descriptions];
                          newDescriptions[i] = content.slice(0, 90);
                          setDescriptions(newDescriptions);
                        }}
                      />
                      {d && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copy(d, 'Description copied')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveAsElement(d, 'description')}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Display Ad Content</h3>
              <DisplayAdCreator
                businessName={businessName}
                setBusinessName={setBusinessName}
                longHeadline={longHeadline}
                setLongHeadline={setLongHeadline}
                shortHeadlines={shortHeadlines}
                setShortHeadlines={setShortHeadlines}
                descriptions={displayDescriptions}
                setDescriptions={setDisplayDescriptions}
                ctaText={ctaText}
                setCtaText={setCtaText}
                landingPage={displayLandingPage}
                setLandingPage={setDisplayLandingPage}
                adEntity={entity}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleCreate} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Creating..." : "Create Ad"}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
