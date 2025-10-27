import { getProfileForLanguage } from "@/lib/adProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

interface TikTokPreviewProps {
  adData: any;
}

export function TikTokPreview({ adData }: TikTokPreviewProps) {
  const profile = getProfileForLanguage(adData.language);
  const isRTL = adData.language === "AR";

  return (
    <div className="max-w-sm mx-auto aspect-[9/16] bg-black relative overflow-hidden rounded-xl">
      {/* Video Background */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        {adData.videoUrl ? (
          <div className="text-white text-center">
            <p className="text-sm mb-2">Video Preview</p>
            <p className="text-xs text-gray-400">{adData.videoUrl}</p>
          </div>
        ) : (
          <div className="text-white/50">
            <p className="text-sm">Video Content</p>
          </div>
        )}
      </div>

      {/* Sidebar Actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-10">
        <div className="flex flex-col items-center">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>{profile.name[0]}</AvatarFallback>
          </Avatar>
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mt-[-12px] border-2 border-black">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Heart className="h-8 w-8 text-white fill-white" />
          <span className="text-white text-xs font-semibold">12.3K</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-8 w-8 text-white" />
          <span className="text-white text-xs font-semibold">234</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Bookmark className="h-8 w-8 text-white" />
          <span className="text-white text-xs font-semibold">891</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Share2 className="h-8 w-8 text-white" />
          <span className="text-white text-xs font-semibold">56</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className={`text-white ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
          <p className="font-semibold mb-1">@{profile.name.toLowerCase().replace(/\s+/g, "")}</p>
          <p className="text-sm mb-2">{adData.caption}</p>
          {adData.hashtags && (
            <p className="text-sm text-blue-300">{adData.hashtags}</p>
          )}
        </div>

        {/* CTA Button */}
        {adData.cta && (
          <button className="mt-3 w-full bg-white text-black font-bold py-2 px-4 rounded-full text-sm">
            {adData.cta}
          </button>
        )}
      </div>
    </div>
  );
}
