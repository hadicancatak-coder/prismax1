import { getProfileForLanguage } from "@/lib/adProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface InstagramPreviewProps {
  adData: any;
}

export function InstagramPreview({ adData }: InstagramPreviewProps) {
  const profile = getProfileForLanguage(adData.language);
  const isRTL = adData.language === "AR";

  return (
    <Card className="max-w-md mx-auto bg-white border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{profile.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{profile.name}</p>
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5" />
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
        {adData.imageUrl ? (
          <img src={adData.imageUrl} alt="Ad" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Image Preview</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>

        {/* Caption */}
        <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
          <span className="font-semibold">{profile.name}</span>{" "}
          {adData.primaryText || adData.headline}
        </div>

        {/* CTA */}
        {adData.cta && (
          <button className="text-blue-500 font-semibold text-sm">{adData.cta}</button>
        )}
      </div>
    </Card>
  );
}
