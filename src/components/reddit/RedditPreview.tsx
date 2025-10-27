import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, MessageSquare, Share, MoreHorizontal } from "lucide-react";

interface RedditPreviewProps {
  adData: any;
}

export function RedditPreview({ adData }: RedditPreviewProps) {
  const isRTL = adData.language === "AR";

  return (
    <Card className="max-w-2xl mx-auto bg-white border shadow-sm">
      <div className="flex gap-2 p-2">
        {/* Voting Section */}
        <div className="flex flex-col items-center gap-1 px-2">
          <ArrowUp className="h-6 w-6 text-muted-foreground hover:text-orange-500 cursor-pointer" />
          <span className="text-xs font-bold">123</span>
          <ArrowDown className="h-6 w-6 text-muted-foreground hover:text-blue-500 cursor-pointer" />
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-semibold">{adData.subreddit || "r/finance"}</span>
            <span>•</span>
            <span>Posted by u/CFI_Group</span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Ad</span>
          </div>

          {/* Title */}
          {adData.title && (
            <h3 className={`font-bold text-lg mb-2 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
              {adData.title}
            </h3>
          )}

          {/* Body Text */}
          {adData.bodyText && (
            <p className={`text-sm mb-3 ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
              {adData.bodyText}
            </p>
          )}

          {/* Link Preview Card */}
          {adData.linkUrl && (
            <div className="border rounded p-3 bg-gray-50 mb-3">
              <p className="text-xs text-muted-foreground mb-1">
                {new URL(adData.linkUrl).hostname}
              </p>
              <p className="text-sm font-medium">{adData.title || "Link Preview"}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
              <MessageSquare className="h-4 w-4" />
              <span>45 Comments</span>
            </button>
            <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
