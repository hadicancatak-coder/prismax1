import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { ENTITIES } from "@/lib/constants";
import { Copy, Eraser, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MetaAdCreatorProps {
  adData: any;
  setAdData: (data: any) => void;
  platform: "facebook" | "instagram" | "whatsapp";
}

export function MetaAdCreator({ adData, setAdData, platform }: MetaAdCreatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopyAll = () => {
    const text = `Headline: ${adData.headline}\nPrimary Text: ${adData.primaryText}\nDescription: ${adData.description}\nCTA: ${adData.cta}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleClear = () => {
    setAdData({
      ...adData,
      headline: "",
      primaryText: "",
      description: "",
      imageUrl: "",
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("ads").insert({
        name: `${platform} Ad - ${adData.headline.substring(0, 30)}`,
        ad_type: platform,
        headlines: [{ text: adData.headline }],
        primary_text: adData.primaryText,
        descriptions: [{ text: adData.description }],
        image_url: adData.imageUrl,
        cta_text: adData.cta,
        entity: adData.entity,
        language: adData.language,
        created_by: user.id,
      });

      if (error) throw error;
      toast({ title: "Ad saved successfully" });
    } catch (error: any) {
      toast({ title: "Error saving ad", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{platform} Ad</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyAll}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div>
        <Label>Language</Label>
        <ToggleGroup
          type="single"
          value={adData.language}
          onValueChange={(v) => v && setAdData({ ...adData, language: v })}
          className="justify-start mt-2"
        >
          <ToggleGroupItem value="EN">English</ToggleGroupItem>
          <ToggleGroupItem value="AR">العربية</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div>
        <Label>Entity/Country</Label>
        <SimpleMultiSelect
          options={ENTITIES.map((e) => ({ value: e, label: e }))}
          selected={adData.entity}
          onChange={(values) => setAdData({ ...adData, entity: values })}
          placeholder="Select entities"
        />
      </div>

      <div>
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={adData.headline}
          onChange={(e) => setAdData({ ...adData, headline: e.target.value })}
          placeholder="Enter headline"
          maxLength={40}
          dir={adData.language === "AR" ? "rtl" : "ltr"}
        />
        <p className="text-xs text-muted-foreground mt-1">{adData.headline.length}/40</p>
      </div>

      <div>
        <Label htmlFor="primaryText">Primary Text</Label>
        <Textarea
          id="primaryText"
          value={adData.primaryText}
          onChange={(e) => setAdData({ ...adData, primaryText: e.target.value })}
          placeholder="Enter primary text"
          rows={3}
          maxLength={125}
          dir={adData.language === "AR" ? "rtl" : "ltr"}
        />
        <p className="text-xs text-muted-foreground mt-1">{adData.primaryText.length}/125</p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={adData.description}
          onChange={(e) => setAdData({ ...adData, description: e.target.value })}
          placeholder="Enter description"
          rows={2}
          maxLength={30}
          dir={adData.language === "AR" ? "rtl" : "ltr"}
        />
        <p className="text-xs text-muted-foreground mt-1">{adData.description.length}/30</p>
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={adData.imageUrl}
          onChange={(e) => setAdData({ ...adData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <Label htmlFor="cta">Call to Action</Label>
        <Input
          id="cta"
          value={adData.cta}
          onChange={(e) => setAdData({ ...adData, cta: e.target.value })}
          placeholder="Learn More"
        />
      </div>
    </div>
  );
}
