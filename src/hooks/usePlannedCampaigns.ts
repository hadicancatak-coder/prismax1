import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaLocation } from "./useMediaLocations";

export interface PlannedCampaign {
  id: string;
  name: string;
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

export const getSeasonIndicator = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check overlap with UAE peak season (Nov-Mar)
  const hasUAEPeak = [10, 11, 0, 1, 2].some(month => {
    const testDate = new Date(start);
    while (testDate <= end) {
      if (testDate.getMonth() === month) return true;
      testDate.setMonth(testDate.getMonth() + 1);
    }
    return false;
  });
  
  // Check overlap with GCC summer (Jun-Aug)
  const hasGCCSummer = [5, 6, 7].some(month => {
    const testDate = new Date(start);
    while (testDate <= end) {
      if (testDate.getMonth() === month) return true;
      testDate.setMonth(testDate.getMonth() + 1);
    }
    return false;
  });
  
  if (hasUAEPeak) {
    return 'UAE Peak Season (Nov-Mar)';
  } else if (hasGCCSummer) {
    return 'GCC Summer (Jun-Aug)';
  }
  
  return 'Regular Season';
  // Filter by selected cities only
  const filteredLocations = locations.filter(loc => cities.includes(loc.city));
  
  if (filteredLocations.length === 0 || budget <= 0 || duration <= 0) {
    return [];
  }
  
  // Get seasonal price multiplier
  const { priceMultiplier } = startDate && endDate 
    ? getSeasonalMultiplier(startDate, endDate)
    : { priceMultiplier: 1.0 };
  
  // Calculate efficiency for each location using historical pricing
  const locationsWithEfficiency = filteredLocations
    .map(loc => {
      // Get historic prices for this location
      const locationPrices = historicPrices.filter(p => p.location_id === loc.id);
      
      // Skip if no historic prices
      if (locationPrices.length === 0) {
        return null;
      }
      
      // Calculate average historical price with seasonal adjustment
      const avgHistoricalPrice = locationPrices.reduce((sum, p) => sum + p.price, 0) / locationPrices.length;
      const adjustedPrice = avgHistoricalPrice * priceMultiplier;
      
      // Calculate cost for campaign duration
      const cost = adjustedPrice * duration;
      
      // Calculate impressions (daily traffic × days in duration)
      const impressions = (loc.est_daily_traffic || 0) * duration * 30;
      
      // Calculate efficiency: (impressions × score) / cost
      // Higher score = better value (more impressions per AED spent)
      const efficiency = impressions > 0 && cost > 0 
        ? (impressions * (loc.manual_score || 1)) / cost 
        : 0;
      
      return {
        location: loc,
        cost,
        impressions,
        efficiency,
        score: loc.manual_score || 0,
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => {
      // Sort by efficiency (desc), then score (desc), then cost (asc)
      if (b!.efficiency !== a!.efficiency) return b!.efficiency - a!.efficiency;
      if (b!.score !== a!.score) return b!.score - a!.score;
      return a!.cost - b!.cost;
    }) as Array<{ location: MediaLocation; cost: number; impressions: number; efficiency: number; score: number }>;
  
  // Greedy algorithm: maximize impressions within budget
  const selected: Array<{ location: MediaLocation; cost: number }> = [];
  let remainingBudget = budget;
  
  for (const item of locationsWithEfficiency) {
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
