import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ComplianceAsset {
  id: string;
  request_id: string;
  asset_type: "text" | "image" | "video" | "link";
  asset_content: string;
  asset_metadata: Record<string, any>;
  status: "pending" | "approved" | "rejected";
  version_number: number;
  created_at: string;
}

export interface ComplianceRequest {
  id: string;
  entity?: string;
  title: string;
  description: string | null;
  initial_comments?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "approved" | "rejected" | "partial";
  public_link_token: string;
  assets?: ComplianceAsset[];
}

export const useComplianceRequests = () => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["compliance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_requests")
        .select(`
          *,
          assets:compliance_assets(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ComplianceRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (data: {
      entity: string;
      title: string;
      description?: string;
      initial_comments?: string;
      assets: Array<{
        asset_type: "text" | "image" | "video" | "link";
        asset_content: string;
        asset_metadata?: Record<string, any>;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: request, error: requestError } = await supabase
        .from("compliance_requests")
        .insert({
          entity: data.entity,
          title: data.title,
          description: data.description,
          initial_comments: data.initial_comments,
          created_by: user.id,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      if (data.assets.length > 0) {
        const { error: assetsError } = await supabase
          .from("compliance_assets")
          .insert(
            data.assets.map((asset) => ({
              request_id: request.id,
              asset_type: asset.asset_type,
              asset_content: asset.asset_content,
              asset_metadata: asset.asset_metadata || {},
            }))
          );

        if (assetsError) throw assetsError;
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Compliance request created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create request: " + error.message);
    },
  });

  const updateRequest = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      description?: string;
      status?: "pending" | "approved" | "rejected" | "partial";
    }) => {
      const { error } = await supabase
        .from("compliance_requests")
        .update({
          title: data.title,
          description: data.description,
          status: data.status,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Request updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update request: " + error.message);
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("compliance_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Request deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete request: " + error.message);
    },
  });

  const uploadAsset = async (file: File, requestId: string): Promise<string> => {
    // Server-side validation
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_SIZE) {
      throw new Error("File size exceeds 2 MB limit. Please provide a link instead.");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${requestId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("compliance-assets")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("compliance-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addAssetToRequest = useMutation({
    mutationFn: async (data: {
      requestId: string;
      asset_type: "text" | "image" | "video" | "link";
      asset_content: string;
      asset_metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase.from("compliance_assets").insert({
        request_id: data.requestId,
        asset_type: data.asset_type,
        asset_content: data.asset_content,
        asset_metadata: data.asset_metadata || {},
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Asset added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add asset: " + error.message);
    },
  });

  const updateAsset = useMutation({
    mutationFn: async (data: {
      assetId: string;
      asset_content: string;
      asset_metadata?: Record<string, any>;
    }) => {
      const { data: currentAsset, error: fetchError } = await supabase
        .from("compliance_assets")
        .select("version_number")
        .eq("id", data.assetId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("compliance_assets")
        .update({
          asset_content: data.asset_content,
          asset_metadata: data.asset_metadata,
          version_number: currentAsset.version_number + 1,
          status: "pending",
        })
        .eq("id", data.assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Asset updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update asset: " + error.message);
    },
  });

  const bulkDeleteRequests = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { error } = await supabase
        .from("compliance_requests")
        .delete()
        .in("id", requestIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Requests deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete requests: " + error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async (data: { requestIds: string[]; status: string }) => {
      const { error } = await supabase
        .from("compliance_requests")
        .update({ status: data.status })
        .in("id", data.requestIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-requests"] });
      toast.success("Status updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  return {
    requests,
    isLoading,
    createRequest: createRequest.mutate,
    updateRequest: updateRequest.mutate,
    deleteRequest: deleteRequest.mutate,
    uploadAsset,
    addAssetToRequest: addAssetToRequest.mutate,
    updateAsset: updateAsset.mutate,
    bulkDeleteRequests: bulkDeleteRequests.mutate,
    bulkUpdateStatus: bulkUpdateStatus.mutate,
  };
};
