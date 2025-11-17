import { format } from "date-fns";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ComplianceReview } from "@/hooks/useComplianceReviews";

interface ReviewLogPanelProps {
  reviews: ComplianceReview[];
}

export function ReviewLogPanel({ reviews }: ReviewLogPanelProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 border rounded-md bg-muted/30 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-medium text-sm">{review.reviewer_name}</div>
              <div className="text-xs text-muted-foreground">
                {review.reviewer_email}
              </div>
            </div>
            <Badge
              variant={review.action === "approved" ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {review.action === "approved" ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {review.action.charAt(0).toUpperCase() + review.action.slice(1)}
            </Badge>
          </div>

          {review.comments && (
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">{review.comments}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {format(new Date(review.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      ))}
    </div>
  );
}
