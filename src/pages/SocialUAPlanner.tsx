import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MetaAdCreator } from "@/components/socialua/MetaAdCreator";
import { FacebookPreview } from "@/components/socialua/FacebookPreview";
import { InstagramPreview } from "@/components/socialua/InstagramPreview";
import { WhatsAppPreview } from "@/components/socialua/WhatsAppPreview";
import { SavedElementsLibrary } from "@/components/socialua/SavedElementsLibrary";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

export default function SocialUAPlanner() {
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "whatsapp">("facebook");
  const [adData, setAdData] = useState({
    headline: "",
    primaryText: "",
    description: "",
    imageUrl: "",
    cta: "Learn More",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  const handleElementSelect = (element: any) => {
    const content = element.content;
    if (element.element_type === "headline") {
      setAdData((prev) => ({ ...prev, headline: content.text || "" }));
    } else if (element.element_type === "primary_text") {
      setAdData((prev) => ({ ...prev, primaryText: content.text || "" }));
    } else if (element.element_type === "description") {
      setAdData((prev) => ({ ...prev, description: content.text || "" }));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">SocialUA Planner</h1>
          <p className="text-muted-foreground">
            Create and preview Meta ads for Facebook, Instagram, and WhatsApp
          </p>
        </div>

        <Tabs value={platform} onValueChange={(v) => setPlatform(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-6">
              <Card className="p-6">
                <MetaAdCreator
                  adData={adData}
                  setAdData={setAdData}
                  platform={platform}
                />
              </Card>

              <SavedElementsLibrary
                platform={platform}
                onElementSelect={handleElementSelect}
              />
            </div>

            <div>
              <Card className="p-6 sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <TabsContent value="facebook" className="mt-0">
                  <FacebookPreview adData={adData} />
                </TabsContent>
                <TabsContent value="instagram" className="mt-0">
                  <InstagramPreview adData={adData} />
                </TabsContent>
                <TabsContent value="whatsapp" className="mt-0">
                  <WhatsAppPreview adData={adData} />
                </TabsContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
  );
}
