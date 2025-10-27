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
import { ElementQuickInsert } from "@/components/ads/ElementQuickInsert";
import { useSaveSocialElement } from "@/hooks/useSocialAdElements";

interface TikTokAdCreatorProps {
  adData: any;
  setAdData: (data: any) => void;
}

export function TikTokAdCreator({ adData, setAdData }: TikTokAdCreatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const saveElement = useSaveSocialElement();

  const handleCopyAll = () => {
    const text = `Caption: ${adData.caption}\nVideo Title: ${adData.videoTitle}\nHashtags: ${adData.hashtags}`;
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
      caption: "",
      videoTitle: "",
      description: "",
      hashtags: "",
      videoUrl: "",
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("ads").insert({
        name: `TikTok Ad - ${adData.caption.substring(0, 30)}`,
        ad_type: "tiktok",
        caption: adData.caption,
        headlines: [{ text: adData.videoTitle }],
        descriptions: [{ text: adData.description }],
        video_url: adData.videoUrl,
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
        <h3 className="text-lg font-semibold">TikTok Ad</h3>
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
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input
          id="videoUrl"
          value={adData.videoUrl}
          onChange={(e) => setAdData({ ...adData, videoUrl: e.target.value })}
          placeholder="https://example.com/video.mp4"
        />
      </div>

      <div>
        <Label htmlFor="caption">Caption</Label>
        <div className="flex gap-2 items-start">
          <Textarea
            id="caption"
            value={adData.caption}
            onChange={(e) => setAdData({ ...adData, caption: e.target.value })}
            placeholder="Enter caption"
            rows={3}
            maxLength={150}
            dir={adData.language === "AR" ? "rtl" : "ltr"}
          />
          <div className="flex flex-col gap-1 shrink-0 pt-2">
            <ElementQuickInsert
              elementType="description"
              onInsert={(text) => setAdData({ ...adData, caption: text.slice(0, 150) })}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSaveField(adData.caption, "description")}
              disabled={!adData.caption.trim() || !adData.entity || adData.entity.length === 0}
              title="Save for reuse"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(adData.caption)}
              disabled={!adData.caption}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{adData.caption.length}/150</p>
      </div>

      <div>
        <Label htmlFor="hashtags">Hashtags</Label>
        <Input
          id="hashtags"
          value={adData.hashtags}
          onChange={(e) => setAdData({ ...adData, hashtags: e.target.value })}
          placeholder="#finance #trading #investment"
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
