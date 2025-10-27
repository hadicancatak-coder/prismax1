import { getProfileForLanguage } from "@/lib/adProfiles";
import { ArrowLeft, ArrowUp } from "lucide-react";

interface SnapPreviewProps {
  adData: any;
}

export function SnapPreview({ adData }: SnapPreviewProps) {
  const profile = getProfileForLanguage(adData.language);
  const isRTL = adData.language === "AR";

  return (
    <div className="max-w-sm mx-auto aspect-[9/16] bg-black relative overflow-hidden rounded-xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center gap-2">
        <ArrowLeft className="h-6 w-6 text-white" />
        <div className="flex-1 text-white">
          <p className="font-semibold text-sm">{adData.brandName}</p>
          <p className="text-xs">Sponsored</p>
        </div>
      </div>

      {/* Image/Video Background */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        {adData.imageUrl || adData.videoUrl ? (
          <img
            src={adData.imageUrl || adData.videoUrl}
            alt="Ad"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/50">
            <p className="text-sm">Story Content</p>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {adData.headline && (
          <div className={`text-white mb-4 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
            <p className="font-bold text-lg">{adData.headline}</p>
          </div>
        )}

        {/* Swipe Up CTA */}
        {adData.cta && (
          <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm rounded-full py-3 px-6 text-white animate-bounce">
            <ArrowUp className="h-5 w-5" />
            <span className="font-bold">{adData.cta}</span>
          </div>
        )}
      </div>
    </div>
  );
}
