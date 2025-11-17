import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignEntityTracking {
  id: string;
  campaign_id: string;
  entity: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useCampaignEntityTracking = () => {
  const queryClient = useQueryClient();

  // Fetch all tracking records
  const { data: trackingRecords = [], isLoading } = useQuery({
    queryKey: ["campaign-entity-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_entity_tracking")
        .select("*")
        .order("entity", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CampaignEntityTracking[];
    },
  });

  // Create tracking record
  const createTracking = useMutation({
    mutationFn: async (tracking: {
      campaign_id: string;
      entity: string;
      status?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("campaign_entity_tracking")
        .insert({
          ...tracking,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-entity-tracking"] });
      toast.success("Campaign added to entity");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Campaign already exists in this entity");
      } else {
        toast.error("Failed to add campaign to entity");
      }
    },
  });

  // Update tracking record
  const updateTracking = useMutation({
    mutationFn: async (tracking: Partial<CampaignEntityTracking> & { id: string }) => {
      const { id, ...updates } = tracking;
      const { data, error } = await supabase
        .from("campaign_entity_tracking")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-entity-tracking"] });
    },
    onError: () => {
      toast.error("Failed to update campaign");
    },
  });

  // Delete tracking record
  const deleteTracking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_entity_tracking")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-entity-tracking"] });
      toast.success("Campaign removed from entity");
    },
    onError: () => {
      toast.error("Failed to remove campaign");
    },
  });

  // Helper: Get campaigns by entity
  const getCampaignsByEntity = (entity: string) => {
    return trackingRecords.filter((t) => t.entity === entity);
  };

  // Helper: Get entities for a campaign
  const getEntitiesForCampaign = (campaignId: string) => {
    return trackingRecords.filter((t) => t.campaign_id === campaignId);
  };

  return {
    trackingRecords,
    isLoading,
    createTracking,
    updateTracking,
    deleteTracking,
    getCampaignsByEntity,
    getEntitiesForCampaign,
  };
};
