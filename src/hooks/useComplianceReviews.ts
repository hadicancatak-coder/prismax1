import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComplianceReview {
  id: string;
  request_id: string;
  asset_id: string;
  reviewer_name: string;
  reviewer_email: string;
  action: "approved" | "rejected";
  comments: string | null;
  reviewed_at: string;
  ip_address: string | null;
}

export const useComplianceReviews = (requestId?: string) => {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["compliance-reviews", requestId],
    queryFn: async () => {
      if (!requestId) return [];

      const { data, error } = await supabase
        .from("compliance_reviews")
        .select("*")
        .eq("request_id", requestId)
        .order("reviewed_at", { ascending: false });

      if (error) throw error;
      return data as ComplianceReview[];
    },
    enabled: !!requestId,
  });

  const submitReview = useMutation({
    mutationFn: async (data: {
      requestId: string;
      assetId: string;
      reviewerName: string;
      reviewerEmail: string;
      action: "approved" | "rejected";
      comments?: string;
    }) => {
      const { error: reviewError } = await supabase
        .from("compliance_reviews")
        .insert({
          request_id: data.requestId,
          asset_id: data.assetId,
          reviewer_name: data.reviewerName,
          reviewer_email: data.reviewerEmail,
          action: data.action,
          comments: data.comments || null,
        });

      if (reviewError) throw reviewError;

      // Update asset status
      const { error: assetError } = await supabase
        .from("compliance_assets")
        .update({ status: data.action })
        .eq("id", data.assetId);

      if (assetError) throw assetError;

      // Check if all assets are reviewed and update request status
      const { data: assets, error: assetsError } = await supabase
        .from("compliance_assets")
        .select("status")
        .eq("request_id", data.requestId);

      if (assetsError) throw assetsError;

      const allApproved = assets.every((a) => a.status === "approved");
      const anyRejected = assets.some((a) => a.status === "rejected");
      const allReviewed = assets.every((a) => a.status !== "pending");

      let requestStatus: "pending" | "approved" | "rejected" | "partial" = "pending";
      if (allReviewed) {
        if (allApproved) {
          requestStatus = "approved";
        } else if (anyRejected && !allApproved) {
          requestStatus = "partial";
        } else if (assets.every((a) => a.status === "rejected")) {
          requestStatus = "rejected";
        }
      }

      const { error: requestError } = await supabase
        .from("compliance_requests")
        .update({ status: requestStatus })
        .eq("id", data.requestId);

      if (requestError) throw requestError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Review submitted");
    },
    onError: (error: Error) => {
      toast.error("Failed to submit review: " + error.message);
    },
  });

  const getReviewStats = (requestId: string) => {
    return useQuery({
      queryKey: ["compliance-review-stats", requestId],
      queryFn: async () => {
        const { data: assets, error } = await supabase
          .from("compliance_assets")
          .select("status")
          .eq("request_id", requestId);

        if (error) throw error;

        return {
          total: assets.length,
          approved: assets.filter((a) => a.status === "approved").length,
          rejected: assets.filter((a) => a.status === "rejected").length,
          pending: assets.filter((a) => a.status === "pending").length,
        };
      },
    });
  };

  return {
    reviews,
    isLoading,
    submitReview: submitReview.mutate,
    getReviewStats,
  };
};
