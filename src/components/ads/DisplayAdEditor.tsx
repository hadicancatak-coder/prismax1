import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ChevronLeft, Eye } from "lucide-react";
import { DisplayAdCreator } from "./DisplayAdCreator";
import { DisplayAdPreviewDialog } from "./DisplayAdPreviewDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkDisplayAdCompliance } from "@/lib/adQualityScore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

interface DisplayAdEditorProps {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
  onSave: (adId?: string) => void;
  onCancel: () => void;
}

export function DisplayAdEditor({ ad, adGroup, campaign, entity, onSave, onCancel }: DisplayAdEditorProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [longHeadline, setLongHeadline] = useState("");
  const [shortHeadlines, setShortHeadlines] = useState<string[]>(Array(5).fill(""));
  const [descriptions, setDescriptions] = useState<string[]>(Array(5).fill(""));
  const [ctaText, setCtaText] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const [language, setLanguage] = useState("EN");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (ad && ad.id) {
      setName(ad.name || "");
      setBusinessName(ad.business_name || "");
      setLongHeadline(ad.long_headline || "");
      setShortHeadlines([...(ad.short_headlines || []), ...Array(5).fill("")].slice(0, 5));
      setDescriptions([...(ad.descriptions || []), ...Array(5).fill("")].slice(0, 5));
      setCtaText(ad.cta_text || "");
      setLandingPage(ad.landing_page || "");
      setLanguage(ad.language || "EN");
    } else {
      setLanguage(campaign?.languages?.[0] || "EN");
    }
  }, [ad, campaign]);

  const complianceIssues = checkDisplayAdCompliance(
    longHeadline,
    shortHeadlines,
    descriptions,
    ctaText,
    entity
  );

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to create ads");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter an ad name");
      return;
    }

    if (!businessName.trim()) {
      toast.error("Please enter a business name");
      return;
    }

    const validShortHeadlines = shortHeadlines.filter(h => h.trim());
    const validDescriptions = descriptions.filter(d => d.trim());

    if (validShortHeadlines.length === 0) {
      toast.error("Please enter at least one short headline");
      return;
    }

    if (validDescriptions.length === 0) {
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
        landing_page: landingPage,
        business_name: businessName,
        language,
        ad_type: "display",
        approval_status: "approved",
        long_headline: longHeadline,
        short_headlines: validShortHeadlines,
        descriptions: validDescriptions,
        cta_text: ctaText,
        ad_strength: 0,
        compliance_issues: complianceIssues.map(issue => ({ message: issue }))
      };

      if (ad?.id) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error('Not authenticated');
        }
        
        const { error } = await supabase
          .from("ads")
          .update({
            ...adData,
            updated_by: authUser.id
          })
          .eq("id", ad.id);
          
        if (error) {
          console.error('Ad update error:', error);
          throw error;
        }
        
        toast.success("Display ad updated successfully");
        onSave(ad.id);
      } else {
        const { data, error } = await supabase
          .from("ads")
          .insert({
            ...adData,
            created_by: user.id
          })
          .select()
          .single();
        if (error) throw error;
        toast.success("Display ad created successfully");
        onSave(data.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save display ad");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {ad?.id ? "Edit Display Ad" : "Create Display Ad"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Ad Name */}
          <div className="space-y-2">
            <Label htmlFor="ad-name">Ad Name *</Label>
            <Input
              id="ad-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter ad name"
            />
          </div>

          {/* Campaign & Ad Group Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Input value={campaign?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Ad Group</Label>
              <Input value={adGroup?.name || ""} disabled />
            </div>
          </div>

          {/* Entity & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entity</Label>
              <Input value={entity} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
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
          </div>

          {/* Compliance Issues */}
          {complianceIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {complianceIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Display Ad Creator Component */}
          <DisplayAdCreator
            businessName={businessName}
            setBusinessName={setBusinessName}
            longHeadline={longHeadline}
            setLongHeadline={setLongHeadline}
            shortHeadlines={shortHeadlines}
            setShortHeadlines={setShortHeadlines}
            descriptions={descriptions}
            setDescriptions={setDescriptions}
            ctaText={ctaText}
            setCtaText={setCtaText}
            landingPage={landingPage}
            setLandingPage={setLandingPage}
            adEntity={entity}
          />
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      <DisplayAdPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        businessName={businessName}
        longHeadline={longHeadline}
        shortHeadlines={shortHeadlines}
        descriptions={descriptions}
        ctaText={ctaText}
        landingPage={landingPage}
        language={language}
      />
    </div>
  );
}
