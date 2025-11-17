import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignLocation {
  id: string;
  campaign_id: string;
  location_id: string;
  created_at: string;
}

export const useLocationCampaigns = () => {
  const queryClient = useQueryClient();

  // Fetch all campaign-location associations
  const { data: campaignLocations = [], isLoading } = useQuery({
    queryKey: ['campaign-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_locations')
        .select('*');
      
      if (error) throw error;
      return data as CampaignLocation[];
    },
  });

  // Get locations for a specific campaign
  const getLocationsByCampaign = (campaignId: string) => {
    return campaignLocations.filter(cl => cl.campaign_id === campaignId);
  };

  // Get campaigns for a specific location
  const getCampaignsByLocation = (locationId: string) => {
    return campaignLocations.filter(cl => cl.location_id === locationId);
  };

  // Add location to campaign
  const addLocationToCampaign = useMutation({
    mutationFn: async ({ locationId, campaignId }: { locationId: string; campaignId: string }) => {
      const { data, error } = await supabase
        .from('campaign_locations')
        .insert({ location_id: locationId, campaign_id: campaignId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-locations'] });
      toast.success("Location added to campaign");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add location to campaign");
    },
  });

  // Remove location from campaign
  const removeLocationFromCampaign = useMutation({
    mutationFn: async ({ locationId, campaignId }: { locationId: string; campaignId: string }) => {
      const { error } = await supabase
        .from('campaign_locations')
        .delete()
        .eq('location_id', locationId)
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-locations'] });
      toast.success("Location removed from campaign");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove location from campaign");
    },
  });

  return {
    campaignLocations,
    isLoading,
    getLocationsByCampaign,
    getCampaignsByLocation,
    addLocationToCampaign,
    removeLocationFromCampaign,
  };
};
