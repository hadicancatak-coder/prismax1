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

interface RedditAdCreatorProps {
  adData: any;
  setAdData: (data: any) => void;
}

export function RedditAdCreator({ adData, setAdData }: RedditAdCreatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopyAll = () => {
    const text = `Title: ${adData.title}\n\n${adData.bodyText}\n\nLink: ${adData.linkUrl}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleClear = () => {
    setAdData({
      ...adData,
      title: "",
      bodyText: "",
      linkUrl: "",
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("ads").insert({
        name: `Reddit Ad - ${adData.title.substring(0, 30)}`,
        ad_type: "reddit",
        headlines: [{ text: adData.title }],
        descriptions: [{ text: adData.bodyText }],
        landing_page: adData.linkUrl,
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
        <h3 className="text-lg font-semibold">Reddit Ad</h3>
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
        <Label htmlFor="subreddit">Target Subreddit</Label>
        <Input
          id="subreddit"
          value={adData.subreddit}
          onChange={(e) => setAdData({ ...adData, subreddit: e.target.value })}
          placeholder="r/finance"
        />
      </div>

      <div>
        <Label htmlFor="title">Post Title</Label>
        <Input
          id="title"
          value={adData.title}
          onChange={(e) => setAdData({ ...adData, title: e.target.value })}
          placeholder="Enter post title"
          maxLength={300}
          dir={adData.language === "AR" ? "rtl" : "ltr"}
        />
        <p className="text-xs text-muted-foreground mt-1">{adData.title.length}/300</p>
      </div>

      <div>
        <Label htmlFor="bodyText">Body Text</Label>
        <Textarea
          id="bodyText"
          value={adData.bodyText}
          onChange={(e) => setAdData({ ...adData, bodyText: e.target.value})}
          placeholder="Enter post body"
          rows={5}
          dir={adData.language === "AR" ? "rtl" : "ltr"}
        />
      </div>

      <div>
        <Label htmlFor="linkUrl">Link URL</Label>
        <Input
          id="linkUrl"
          value={adData.linkUrl}
          onChange={(e) => setAdData({ ...adData, linkUrl: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}
