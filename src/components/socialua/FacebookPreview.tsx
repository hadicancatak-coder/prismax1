import { getProfileForLanguage } from "@/lib/adProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

interface FacebookPreviewProps {
  adData: any;
}

export function FacebookPreview({ adData }: FacebookPreviewProps) {
  const profile = getProfileForLanguage(adData.language);
  const isRTL = adData.language === "AR";

  return (
    <Card className="max-w-md mx-auto bg-white border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{profile.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{profile.name}</p>
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Primary Text */}
      {adData.primaryText && (
        <div className={`p-3 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
          <p className="text-sm">{adData.primaryText}</p>
        </div>
      )}

      {/* Image */}
      {adData.imageUrl && (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
          <img src={adData.imageUrl} alt="Ad" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Link Preview Card */}
      <div className="border-t p-3 bg-gray-50">
        <p className="text-xs text-muted-foreground mb-1">cfi.trade</p>
        {adData.headline && (
          <h4 className={`font-bold text-sm mb-1 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
            {adData.headline}
          </h4>
        )}
        {adData.description && (
          <p className={`text-xs text-muted-foreground ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
            {adData.description}
          </p>
        )}
      </div>

      {/* CTA Button */}
      {adData.cta && (
        <div className="px-3 pb-3">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-sm">
            {adData.cta}
          </button>
        </div>
      )}

      {/* Engagement Bar */}
      <div className="border-t p-3 flex justify-around text-muted-foreground">
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">Like</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded">
          <Share2 className="h-4 w-4" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </Card>
  );
}
