import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewerInfoDialog } from "@/components/compliance/ReviewerInfoDialog";
import { AssetReviewCard } from "@/components/compliance/AssetReviewCard";
import { Button } from "@/components/ui/button";
import { ComplianceAsset } from "@/hooks/useComplianceRequests";
import { useComplianceReviews } from "@/hooks/useComplianceReviews";
import { toast } from "sonner";

interface RequestData {
  id: string;
  title: string;
  description: string | null;
  assets: ComplianceAsset[];
}

export default function PublicComplianceReview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewerInfo, setReviewerInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [reviews, setReviews] = useState<Record<string, {
    action: "approved" | "rejected";
    comments: string;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitReview } = useComplianceReviews();

  useEffect(() => {
    // Check localStorage for reviewer info
    const stored = localStorage.getItem("compliance_reviewer_info");
    if (stored) {
      setReviewerInfo(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!token) return;

      try {
        const { data: requestData, error: requestError } = await supabase
          .from("compliance_requests")
          .select("*")
          .eq("public_link_token", token)
          .single();

        if (requestError) throw requestError;

        const { data: assetsData, error: assetsError } = await supabase
          .from("compliance_assets")
          .select("*")
          .eq("request_id", requestData.id);

        if (assetsError) throw assetsError;

        setRequest({
          id: requestData.id,
          title: requestData.title,
          description: requestData.description,
          assets: assetsData.map(asset => ({
            ...asset,
            asset_type: asset.asset_type as "text" | "image" | "video" | "link",
            status: asset.status as "pending" | "approved" | "rejected",
            asset_metadata: asset.asset_metadata as Record<string, any>,
          })),
        });
      } catch (error) {
        console.error("Error fetching request:", error);
        toast.error("Failed to load review request");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [token]);

  const handleReviewerInfoSubmit = (info: { name: string; email: string }) => {
    setReviewerInfo(info);
    localStorage.setItem("compliance_reviewer_info", JSON.stringify(info));
  };

  const handleReviewChange = (
    assetId: string,
    action: "approved" | "rejected",
    comments: string
  ) => {
    setReviews((prev) => ({
      ...prev,
      [assetId]: { action, comments },
    }));
  };

  const handleSubmitAll = async () => {
    if (!request || !reviewerInfo) return;

    const assetIds = request.assets.map((a) => a.id);
    const reviewedAssets = Object.keys(reviews);
    const missingReviews = assetIds.filter((id) => !reviewedAssets.includes(id));

    if (missingReviews.length > 0) {
      toast.error("Please review all assets before submitting");
      return;
    }

    // Check if rejected assets have comments
    const rejectedWithoutComments = Object.entries(reviews).filter(
      ([_, review]) => review.action === "rejected" && !review.comments.trim()
    );

    if (rejectedWithoutComments.length > 0) {
      toast.error("Please add comments for all rejected assets");
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [assetId, review] of Object.entries(reviews)) {
        submitReview({
          requestId: request.id,
          assetId,
          reviewerName: reviewerInfo.name,
          reviewerEmail: reviewerInfo.email,
          action: review.action,
          comments: review.comments,
        });
      }

      toast.success("All reviews submitted successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Request Not Found</h1>
          <p className="text-muted-foreground">
            The review link you're trying to access is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-12 px-4">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                Compliance Review
              </h1>
              <p className="text-xl font-medium">{request.title}</p>
              {request.description && (
                <p className="text-muted-foreground">{request.description}</p>
              )}
            </div>

            {reviewerInfo && (
              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <strong>Reviewer:</strong> {reviewerInfo.name} ({reviewerInfo.email})
              </div>
            )}

            <div className="space-y-4">
              {request.assets.map((asset) => (
                <AssetReviewCard
                  key={asset.id}
                  asset={asset}
                  onReviewChange={(action, comments) =>
                    handleReviewChange(asset.id, action, comments)
                  }
                  currentReview={reviews[asset.id]}
                />
              ))}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit All Reviews"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ReviewerInfoDialog
        open={!reviewerInfo}
        onSubmit={handleReviewerInfoSubmit}
      />
    </>
  );
}
