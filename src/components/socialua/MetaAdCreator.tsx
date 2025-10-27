import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SimpleMultiSelect } from "@/components/utm/SimpleMultiSelect";
import { ENTITIES } from "@/lib/constants";
import { Copy, Eraser, Save, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ElementQuickInsert } from "@/components/ads/ElementQuickInsert";
import { useSaveSocialElement } from "@/hooks/useSocialAdElements";

interface MetaAdCreatorProps {
  adData: any;
  setAdData: (data: any) => void;
  platform: "facebook" | "instagram" | "whatsapp";
}

export function MetaAdCreator({ adData, setAdData, platform }: MetaAdCreatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const saveElement = useSaveSocialElement();

  const handleCopyAll = () => {
    const text = `Headline: ${adData.headline}\nPrimary Text: ${adData.primaryText}\nDescription: ${adData.description}\nCTA: ${adData.cta}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleSaveField = (content: string, type: string) => {
    if (!content.trim() || !adData.entity || adData.entity.length === 0) {
      toast({
        title: "Cannot save",
        description: "Select entity and enter content first",
        variant: "destructive",
      });
      return;
    }
    saveElement.mutate({
      content,
      elementType: type,
      entity: adData.entity,
      language: adData.language,
    });
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
        <div className="flex gap-2 items-center">
          <Input
            id="headline"
            value={adData.headline}
            onChange={(e) => setAdData({ ...adData, headline: e.target.value })}
            placeholder="Enter headline"
            maxLength={40}
            dir={adData.language === "AR" ? "rtl" : "ltr"}
          />
          <ElementQuickInsert
            elementType="headline"
            onInsert={(text) => setAdData({ ...adData, headline: text.slice(0, 40) })}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSaveField(adData.headline, "headline")}
            disabled={!adData.headline.trim() || !adData.entity || adData.entity.length === 0}
            title="Save for reuse"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(adData.headline)}
            disabled={!adData.headline}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{adData.headline.length}/40</p>
      </div>

      <div>
        <Label htmlFor="primaryText">Primary Text</Label>
        <div className="flex gap-2 items-start">
          <Textarea
            id="primaryText"
            value={adData.primaryText}
            onChange={(e) => setAdData({ ...adData, primaryText: e.target.value })}
            placeholder="Enter primary text"
            rows={3}
            maxLength={125}
            dir={adData.language === "AR" ? "rtl" : "ltr"}
          />
          <div className="flex flex-col gap-1 shrink-0 pt-2">
            <ElementQuickInsert
              elementType="description"
              onInsert={(text) => setAdData({ ...adData, primaryText: text.slice(0, 125) })}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSaveField(adData.primaryText, "description")}
              disabled={!adData.primaryText.trim() || !adData.entity || adData.entity.length === 0}
              title="Save for reuse"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(adData.primaryText)}
              disabled={!adData.primaryText}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{adData.primaryText.length}/125</p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <div className="flex gap-2 items-start">
          <Textarea
            id="description"
            value={adData.description}
            onChange={(e) => setAdData({ ...adData, description: e.target.value })}
            placeholder="Enter description"
            rows={2}
            maxLength={30}
            dir={adData.language === "AR" ? "rtl" : "ltr"}
          />
          <div className="flex flex-col gap-1 shrink-0 pt-2">
            <ElementQuickInsert
              elementType="description"
              onInsert={(text) => setAdData({ ...adData, description: text.slice(0, 30) })}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSaveField(adData.description, "description")}
              disabled={!adData.description.trim() || !adData.entity || adData.entity.length === 0}
              title="Save for reuse"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(adData.description)}
              disabled={!adData.description}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
