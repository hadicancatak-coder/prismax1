import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TikTokAdCreator } from "@/components/tiktok/TikTokAdCreator";
import { TikTokPreview } from "@/components/tiktok/TikTokPreview";
import { SavedElementsLibrary } from "@/components/tiktok/SavedElementsLibrary";

export default function TikTokPlanner() {
  const [adData, setAdData] = useState({
    caption: "",
    videoTitle: "",
    description: "",
    hashtags: "",
    videoUrl: "",
    cta: "Learn More",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  const handleElementSelect = (element: any) => {
    const content = element.content;
    if (element.element_type === "caption") {
      setAdData((prev) => ({ ...prev, caption: content.text || "" }));
    } else if (element.element_type === "headline") {
      setAdData((prev) => ({ ...prev, videoTitle: content.text || "" }));
    } else if (element.element_type === "description") {
      setAdData((prev) => ({ ...prev, description: content.text || "" }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">TikTok Planner</h1>
          <p className="text-muted-foreground">
            Create and preview TikTok video ads
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6">
              <TikTokAdCreator adData={adData} setAdData={setAdData} />
            </Card>

            <SavedElementsLibrary
              platform="tiktok"
              onElementSelect={handleElementSelect}
            />
          </div>

          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <TikTokPreview adData={adData} />
            </Card>
          </div>
        </div>
      </div>
  );
}
