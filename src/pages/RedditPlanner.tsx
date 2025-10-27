import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RedditAdCreator } from "@/components/reddit/RedditAdCreator";
import { RedditPreview } from "@/components/reddit/RedditPreview";
import { SavedElementsLibrary } from "@/components/reddit/SavedElementsLibrary";

export default function RedditPlanner() {
  const [adData, setAdData] = useState({
    title: "",
    bodyText: "",
    linkUrl: "",
    subreddit: "r/finance",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  const handleElementSelect = (element: any) => {
    const content = element.content;
    if (element.element_type === "headline") {
      setAdData((prev) => ({ ...prev, title: content.text || "" }));
    } else if (element.element_type === "description") {
      setAdData((prev) => ({ ...prev, bodyText: content.text || "" }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reddit Planner</h1>
          <p className="text-muted-foreground">
            Create and preview Reddit promoted posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6">
              <RedditAdCreator adData={adData} setAdData={setAdData} />
            </Card>

            <SavedElementsLibrary
              platform="reddit"
              onElementSelect={handleElementSelect}
            />
          </div>

          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <RedditPreview adData={adData} />
            </Card>
          </div>
        </div>
      </div>
  );
}
