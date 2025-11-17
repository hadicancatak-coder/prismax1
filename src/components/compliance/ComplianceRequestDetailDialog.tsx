import { format } from "date-fns";
import { ExternalLink, Copy, Upload, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ComplianceRequest } from "@/hooks/useComplianceRequests";
import { useComplianceReviews } from "@/hooks/useComplianceReviews";
import { ReviewLogPanel } from "./ReviewLogPanel";
import { toast } from "sonner";

interface ComplianceRequestDetailDialogProps {
  request: ComplianceRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplianceRequestDetailDialog({
  request,
  open,
  onOpenChange,
}: ComplianceRequestDetailDialogProps) {
  const { reviews } = useComplianceReviews(request.id);

  const copyReviewLink = () => {
    const url = `${window.location.origin}/review/${request.public_link_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Review link copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      partial: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{request.title}</span>
            {getStatusBadge(request.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {request.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={copyReviewLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Review Link
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/review/${request.public_link_token}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Review Page
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3">
              Assets ({request.assets?.length || 0})
            </h3>
            <div className="space-y-2">
              {request.assets?.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {asset.asset_type}
                      </span>
                      {getStatusBadge(asset.status)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {asset.asset_content.slice(0, 80)}...
                    </div>
                    {asset.version_number > 1 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Version {asset.version_number}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Review Log ({reviews?.length || 0})
            </h3>
            <ReviewLogPanel reviews={reviews || []} />
          </div>

          <div className="text-xs text-muted-foreground">
            Created: {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
