import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SnapAdCreator } from "@/components/snap/SnapAdCreator";
import { SnapPreview } from "@/components/snap/SnapPreview";
import { SavedElementsLibrary } from "@/components/snap/SavedElementsLibrary";

export default function SnapPlanner() {
  const [adData, setAdData] = useState({
    headline: "",
    brandName: "CFI Group",
    imageUrl: "",
    videoUrl: "",
    cta: "Swipe Up",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  const handleElementSelect = (element: any) => {
    const content = element.content;
    if (element.element_type === "headline") {
      setAdData((prev) => ({ ...prev, headline: content.text || "" }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Snap Planner</h1>
          <p className="text-muted-foreground">
            Create and preview Snapchat story ads
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6">
              <SnapAdCreator adData={adData} setAdData={setAdData} />
            </Card>

            <SavedElementsLibrary
              platform="snapchat"
              onElementSelect={handleElementSelect}
            />
          </div>

          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <SnapPreview adData={adData} />
            </Card>
          </div>
        </div>
      </div>
  );
}
