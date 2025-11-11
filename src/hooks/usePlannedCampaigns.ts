import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaLocation } from "./useMediaLocations";

export interface PlannedCampaign {
  id: string;
  name: string;
  budget: number;
  start_date: string;
  end_date: string;
  agency?: string;
  cities: string[];
  status: 'draft' | 'active' | 'completed';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignPlacement {
  id: string;
  campaign_id: string;
  location_id: string;
  allocated_budget: number;
  notes?: string;
  created_at: string;
}

export const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.round(diffDays / 30)); // in months
};

export const suggestPlacements = (
  locations: MediaLocation[],
  budget: number,
  duration: number,
  cities: string[]
): Array<{ location: MediaLocation; cost: number }> => {
  // Filter by selected cities AND locations with prices
  const filteredLocations = locations.filter(loc => 
    cities.includes(loc.city) && loc.price_per_month && loc.price_per_month > 0
  );
  
  if (filteredLocations.length === 0 || budget <= 0 || duration <= 0) {
    return [];
  }
  
  // Calculate cost for each location
  const locationsWithCost = filteredLocations
    .map(loc => ({
      location: loc,
      cost: (loc.price_per_month || 0) * duration,
      score: loc.manual_score || 0,
    }))
    .sort((a, b) => {
      // Sort by score (desc) then cost (asc)
      if (b.score !== a.score) return b.score - a.score;
      return a.cost - b.cost;
    });
  
  // Greedy algorithm: select highest scoring that fit budget
  const selected: Array<{ location: MediaLocation; cost: number }> = [];
  let remainingBudget = budget;
  
  for (const item of locationsWithCost) {
    if (item.cost <= remainingBudget) {
      selected.push({ location: item.location, cost: item.cost });
      remainingBudget -= item.cost;
    }
  }
  
  return selected;
};

export const usePlannedCampaigns = () => {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["planned-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planned_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlannedCampaign[];
    },
  });

  const { data: allPlacements = [] } = useQuery({
    queryKey: ["campaign-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_placements")
        .select("*");

      if (error) throw error;
      return data as CampaignPlacement[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async ({ 
      campaign, 
      placements 
    }: { 
      campaign: Omit<PlannedCampaign, "id" | "created_at" | "updated_at">; 
      placements: Array<{ location_id: string; allocated_budget: number }>;
    }) => {
      const { data: newCampaign, error: campaignError } = await supabase
        .from("planned_campaigns")
        .insert([campaign])
        .select()
        .single();

      if (campaignError) throw campaignError;

      const placementsToInsert = placements.map(p => ({
        campaign_id: newCampaign.id,
        ...p,
      }));

      const { error: placementsError } = await supabase
        .from("campaign_placements")
        .insert(placementsToInsert);

      if (placementsError) throw placementsError;

      return newCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-placements"] });
      toast.success("Campaign created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlannedCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("planned_campaigns")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-campaigns"] });
      toast.success("Campaign updated successfully");
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("planned_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-placements"] });
      toast.success("Campaign deleted successfully");
    },
  });

  const getPlacementsForCampaign = (campaignId: string) => {
    return allPlacements.filter(p => p.campaign_id === campaignId);
  };

  return {
    campaigns,
    isLoading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getPlacementsForCampaign,
  };
};
