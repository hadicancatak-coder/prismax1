import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ComplianceAsset } from "@/hooks/useComplianceRequests";
import { TextAssetDisplay } from "./TextAssetDisplay";
import { ImageAssetDisplay } from "./ImageAssetDisplay";
import { VideoAssetDisplay } from "./VideoAssetDisplay";
import { LinkAssetDisplay } from "./LinkAssetDisplay";

interface AssetReviewCardProps {
  asset: ComplianceAsset;
  onReviewChange: (action: "approved" | "rejected", comments: string) => void;
  currentReview?: {
    action: "approved" | "rejected";
    comments: string;
  };
}

export function AssetReviewCard({
  asset,
  onReviewChange,
  currentReview,
}: AssetReviewCardProps) {
  const [action, setAction] = useState<"approved" | "rejected" | null>(
    currentReview?.action || null
  );
  const [comments, setComments] = useState(currentReview?.comments || "");

  const handleActionChange = (value: "approved" | "rejected") => {
    setAction(value);
    onReviewChange(value, comments);
  };

  const handleCommentsChange = (value: string) => {
    setComments(value);
    if (action) {
      onReviewChange(action, value);
    }
  };

  const renderAssetContent = () => {
    switch (asset.asset_type) {
      case "text":
        return <TextAssetDisplay content={asset.asset_content} />;
      case "image":
        return <ImageAssetDisplay url={asset.asset_content} />;
      case "video":
        return <VideoAssetDisplay url={asset.asset_content} />;
      case "link":
        return <LinkAssetDisplay url={asset.asset_content} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{asset.asset_type} Asset</span>
          <Badge variant="secondary">{asset.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          {renderAssetContent()}
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Review Decision</Label>
            <RadioGroup
              value={action || ""}
              onValueChange={(value) => handleActionChange(value as "approved" | "rejected")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id={`approved-${asset.id}`} />
                <Label
                  htmlFor={`approved-${asset.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id={`rejected-${asset.id}`} />
                <Label
                  htmlFor={`rejected-${asset.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                  Reject
                </Label>
              </div>
            </RadioGroup>
          </div>

          {action === "rejected" && (
            <div className="space-y-2">
              <Label htmlFor={`comments-${asset.id}`}>
                Comments / Adjustments Required *
              </Label>
              <Textarea
                id={`comments-${asset.id}`}
                value={comments}
                onChange={(e) => handleCommentsChange(e.target.value)}
                placeholder="Please explain why this asset is being rejected and what changes are needed..."
                rows={4}
                required
              />
            </div>
          )}

          {action === "approved" && (
            <div className="space-y-2">
              <Label htmlFor={`comments-${asset.id}`}>
                Comments (Optional)
              </Label>
              <Textarea
                id={`comments-${asset.id}`}
                value={comments}
                onChange={(e) => handleCommentsChange(e.target.value)}
                placeholder="Add any additional notes or feedback..."
                rows={3}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
