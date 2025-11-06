import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MetaAdCreator } from "@/components/socialua/MetaAdCreator";
import { FacebookPreview } from "@/components/socialua/FacebookPreview";
import { InstagramPreview } from "@/components/socialua/InstagramPreview";
import { WhatsAppPreview } from "@/components/socialua/WhatsAppPreview";
import { SavedElementsLibrary } from "@/components/socialua/SavedElementsLibrary";
import { TikTokAdCreator } from "@/components/tiktok/TikTokAdCreator";
import { TikTokPreview } from "@/components/tiktok/TikTokPreview";
import { SnapAdCreator } from "@/components/snap/SnapAdCreator";
import { SnapPreview } from "@/components/snap/SnapPreview";
import { RedditAdCreator } from "@/components/reddit/RedditAdCreator";
import { RedditPreview } from "@/components/reddit/RedditPreview";
import { Facebook, Instagram, MessageCircle, Music, Camera, MessageSquare, Library } from "lucide-react";

export default function SocialUAPlanner() {
  const [activePlatform, setActivePlatform] = useState<string>("facebook");

  // Meta platforms state
  const [metaData, setMetaData] = useState({
    headline: "",
    primaryText: "",
    description: "",
    imageUrl: "",
    cta: "Learn More",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  // TikTok state
  const [tiktokData, setTiktokData] = useState({
    caption: "",
    videoTitle: "",
    description: "",
    hashtags: "",
    videoUrl: "",
    cta: "Learn More",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  // Snap state
  const [snapData, setSnapData] = useState({
    headline: "",
    brandName: "CFI Group",
    imageUrl: "",
    videoUrl: "",
    cta: "Swipe Up",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  // Reddit state
  const [redditData, setRedditData] = useState({
    title: "",
    bodyText: "",
    linkUrl: "",
    subreddit: "r/finance",
    language: "EN" as "EN" | "AR",
    entity: [] as string[],
  });

  const handleElementSelect = (element: any) => {
    const content = element.content;
    const platform = element.platform;
    
    if (platform === 'facebook' || platform === 'instagram' || platform === 'whatsapp') {
      if (element.element_type === "headline") {
        setMetaData((prev) => ({ ...prev, headline: content.text || "" }));
      } else if (element.element_type === "primary_text") {
        setMetaData((prev) => ({ ...prev, primaryText: content.text || "" }));
      } else if (element.element_type === "description") {
        setMetaData((prev) => ({ ...prev, description: content.text || "" }));
      }
    } else if (platform === 'tiktok') {
      if (element.element_type === "caption") {
        setTiktokData((prev) => ({ ...prev, caption: content.text || "" }));
      } else if (element.element_type === "headline") {
        setTiktokData((prev) => ({ ...prev, videoTitle: content.text || "" }));
      }
    } else if (platform === 'snapchat') {
      if (element.element_type === "headline") {
        setSnapData((prev) => ({ ...prev, headline: content.text || "" }));
      }
    } else if (platform === 'reddit') {
      if (element.element_type === "headline") {
        setRedditData((prev) => ({ ...prev, title: content.text || "" }));
      } else if (element.element_type === "description") {
        setRedditData((prev) => ({ ...prev, bodyText: content.text || "" }));
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8 bg-background">
      <div>
        <h1 className="text-page-title">Social Media Planner</h1>
        <p className="text-muted-foreground mt-1">
          Create and preview ads for all social platforms
        </p>
      </div>

      <Tabs value={activePlatform} onValueChange={setActivePlatform}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-7 w-full lg:w-auto gap-1">
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline">Facebook</span>
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            <span className="hidden sm:inline">Instagram</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="snap" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Snap</span>
          </TabsTrigger>
          <TabsTrigger value="reddit" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Reddit</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
          </TabsTrigger>
        </TabsList>

        {/* Facebook */}
        <TabsContent value="facebook">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <MetaAdCreator
                adData={metaData}
                setAdData={setMetaData}
                platform="facebook"
              />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <FacebookPreview adData={metaData} />
            </div>
          </div>
        </TabsContent>

        {/* Instagram */}
        <TabsContent value="instagram">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <MetaAdCreator
                adData={metaData}
                setAdData={setMetaData}
                platform="instagram"
              />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <InstagramPreview adData={metaData} />
            </div>
          </div>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <MetaAdCreator
                adData={metaData}
                setAdData={setMetaData}
                platform="whatsapp"
              />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <WhatsAppPreview adData={metaData} />
            </div>
          </div>
        </TabsContent>

        {/* TikTok */}
        <TabsContent value="tiktok">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <TikTokAdCreator adData={tiktokData} setAdData={setTiktokData} />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <TikTokPreview adData={tiktokData} />
            </div>
          </div>
        </TabsContent>

        {/* Snap */}
        <TabsContent value="snap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <SnapAdCreator adData={snapData} setAdData={setSnapData} />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <SnapPreview adData={snapData} />
            </div>
          </div>
        </TabsContent>

        {/* Reddit */}
        <TabsContent value="reddit">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded p-6">
              <RedditAdCreator adData={redditData} setAdData={setRedditData} />
            </div>
            <div className="bg-card border border-border rounded p-6 sticky top-6">
              <h3 className="text-section-title mb-4">Preview</h3>
              <RedditPreview adData={redditData} />
            </div>
          </div>
        </TabsContent>

        {/* Saved Elements Library */}
        <TabsContent value="saved">
          <SavedElementsLibrary
            platform={activePlatform}
            onElementSelect={handleElementSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
