import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LocationType = 
  | 'Billboard'
  | 'LED Screen'
  | 'LED'
  | 'Digital Screen'
  | 'Unipoles/Megacorns'
  | 'Lampposts'
  | 'Mupis'
  | 'Bus Shelter'
  | 'Street Furniture'
  | 'In-Mall Media'
  | 'Hoardings'
  | 'Wall Wraps'
  | 'Roof Top Screens'
  | 'Transit'
  | 'Airport'
  | 'Tram'
  | 'Metro'
  | 'Elevator Screen'
  | 'Other';

export interface MediaLocation {
  id: string;
  name: string;
  city: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  notes?: string;
  manual_score?: number;
  image_url?: string;
  agency?: string;
  price_per_month?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricPrice {
  id: string;
  location_id: string;
  year: number;
  price: number;
  created_at: string;
}

export interface PastCampaign {
  id: string;
  location_id: string;
  campaign_name: string;
  budget: number;
  campaign_date: string;
  notes?: string;
  created_at: string;
}

export interface LocationWithDetails extends MediaLocation {
  historic_prices: HistoricPrice[];
  past_campaigns: PastCampaign[];
}

export const useMediaLocations = () => {
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["media-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MediaLocation[];
    },
  });

  const { data: allPrices = [] } = useQuery({
    queryKey: ["location-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("location_historic_prices")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;
      return data as HistoricPrice[];
    },
  });

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["location-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("location_past_campaigns")
        .select("*")
        .order("campaign_date", { ascending: false });

      if (error) throw error;
      return data as PastCampaign[];
    },
  });

  const createLocation = useMutation({
    mutationFn: async (location: Omit<MediaLocation, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("media_locations")
        .insert([location as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-locations"] });
      toast.success("Location created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create location: ${error.message}`);
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MediaLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from("media_locations")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-locations"] });
      toast.success("Location updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update location: ${error.message}`);
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("media_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete location: ${error.message}`);
    },
  });

  const upsertPrices = useMutation({
    mutationFn: async ({ locationId, prices }: { locationId: string; prices: Array<{ year: number; price: number }> }) => {
      // Delete existing prices first
      await supabase
        .from("location_historic_prices")
        .delete()
        .eq("location_id", locationId);

      // Insert new prices
      const { error } = await supabase
        .from("location_historic_prices")
        .insert(prices.map(p => ({ location_id: locationId, ...p })));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-prices"] });
    },
  });

  const upsertCampaigns = useMutation({
    mutationFn: async ({ locationId, campaigns }: { locationId: string; campaigns: Array<Omit<PastCampaign, "id" | "location_id" | "created_at">> }) => {
      // Delete existing campaigns first
      await supabase
        .from("location_past_campaigns")
        .delete()
        .eq("location_id", locationId);

      // Insert new campaigns
      const { error } = await supabase
        .from("location_past_campaigns")
        .insert(campaigns.map(c => ({ location_id: locationId, ...c })));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-campaigns"] });
    },
  });

  const uploadImage = async (file: File, locationId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${locationId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('location_images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('location_images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const getLocationWithDetails = (locationId: string): LocationWithDetails | undefined => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return undefined;

    return {
      ...location,
      historic_prices: allPrices.filter(p => p.location_id === locationId),
      past_campaigns: allCampaigns.filter(c => c.location_id === locationId),
    };
  };

  return {
    locations,
    isLoading,
    createLocation,
    updateLocation,
    deleteLocation,
    upsertPrices,
    upsertCampaigns,
    uploadImage,
    getLocationWithDetails,
  };
};
