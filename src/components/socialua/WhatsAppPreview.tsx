import { getProfileForLanguage } from "@/lib/adProfiles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface WhatsAppPreviewProps {
  adData: any;
}

export function WhatsAppPreview({ adData }: WhatsAppPreviewProps) {
  const profile = getProfileForLanguage(adData.language);
  const isRTL = adData.language === "AR";

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-xs text-center text-muted-foreground mb-4">WhatsApp Status</p>
        
        <Card className="bg-white border shadow-sm overflow-hidden">
          {/* Status Header */}
          <div className="flex items-center gap-2 p-3 bg-green-600 text-white">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{profile.name}</p>
              <p className="text-xs opacity-80">Now</p>
            </div>
          </div>

          {/* Image */}
          <div className="w-full aspect-[9/16] bg-black flex items-center justify-center">
            {adData.imageUrl ? (
              <img src={adData.imageUrl} alt="Ad" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-white">
                <p className="text-sm">Status Image</p>
              </div>
            )}
          </div>

          {/* Status Text Overlay */}
          {(adData.headline || adData.primaryText) && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className={`text-white text-center ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
                {adData.headline || adData.primaryText}
              </p>
            </div>
          )}

          {/* CTA Button */}
          {adData.cta && (
            <div className="p-3 bg-green-600">
              <button className="w-full bg-white text-green-600 font-semibold py-2 px-4 rounded text-sm">
                {adData.cta}
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
