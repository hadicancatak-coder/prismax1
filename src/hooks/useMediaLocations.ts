import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LocationType = 
  // Iconic / Landmark Assets
  | 'Airport Media'
  | 'LED Tower'
  | '3D Digital Vessel'
  | 'Building Wrap'
  | 'Iconic Art (Station Wrap)'
  | 'Station Wrap (Generic)'
  // Premium Large-Format Roadside
  | 'Digital Unipole'
  | 'LED Unipole'
  | 'Megacom'
  | 'Megacom Board'
  | 'Hoarding'
  | 'TPS / Hoarding'
  // Bridges & Gateways
  | 'Bridge'
  | 'Bridge Banner'
  | 'Static Bridge Banner'
  // Urban Digital Screens
  | 'LED Screen'
  | 'Digital Screen'
  | 'Destination Display'
  | 'Light Box'
  | 'Vertical Light Box'
  | 'Piers (Backlit Lightbox)'
  // Street Furniture
  | 'Lamppost'
  | 'Mupi'
  | 'Mupi Board'
  | 'Mupi Digital'
  | 'Bus Shelter'
  // Transit / Metro
  | 'Metro Pillars (Backlit Lightbox)'
  // Retail & Indoor Media
  | 'In-Mall Screen'
  | 'Elevator Screen'
  // Glass & Wall Treatments
  | 'Wall Banner'
  | 'Glass Wrap';

export type LocationCategory = 
  | 'Iconic / Landmark Assets'
  | 'Premium Large-Format Roadside'
  | 'Bridges & Gateways'
  | 'Urban Digital Screens'
  | 'Street Furniture'
  | 'Transit / Metro'
  | 'Retail & Indoor Media'
  | 'Glass & Wall Treatments';

export const LOCATION_CATEGORIES: Record<LocationCategory, {
  emoji: string;
  types: LocationType[];
  color: string;
}> = {
  'Iconic / Landmark Assets': {
    emoji: '🏙',
    types: ['Airport Media', 'LED Tower', '3D Digital Vessel', 'Building Wrap', 
            'Iconic Art (Station Wrap)', 'Station Wrap (Generic)'],
    color: '#f59e0b',
  },
  'Premium Large-Format Roadside': {
    emoji: '🚗',
    types: ['Digital Unipole', 'LED Unipole', 'Megacom', 'Megacom Board', 
            'Hoarding', 'TPS / Hoarding'],
    color: '#ef4444',
  },
  'Bridges & Gateways': {
    emoji: '🌉',
    types: ['Bridge', 'Bridge Banner', 'Static Bridge Banner'],
    color: '#8b5cf6',
  },
  'Urban Digital Screens': {
    emoji: '💡',
    types: ['LED Screen', 'Digital Screen', 'Destination Display', 
            'Light Box', 'Vertical Light Box', 'Piers (Backlit Lightbox)'],
    color: '#3b82f6',
  },
  'Street Furniture': {
    emoji: '🪧',
    types: ['Lamppost', 'Mupi', 'Mupi Board', 'Mupi Digital', 'Bus Shelter'],
    color: '#10b981',
  },
  'Transit / Metro': {
    emoji: '🚆',
    types: ['Metro Pillars (Backlit Lightbox)'],
    color: '#6366f1',
  },
  'Retail & Indoor Media': {
    emoji: '🛍',
    types: ['In-Mall Screen', 'Elevator Screen'],
    color: '#f97316',
  },
  'Glass & Wall Treatments': {
    emoji: '🧱',
    types: ['Wall Banner', 'Glass Wrap'],
    color: '#64748b',
  },
};

export const getLocationCategory = (type: LocationType): LocationCategory | null => {
  for (const [category, config] of Object.entries(LOCATION_CATEGORIES)) {
    if (config.types.includes(type)) {
      return category as LocationCategory;
    }
  }
  return null;
};

export interface MediaLocation {
  id: string;
  name: string;
  city: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  notes?: string;
  image_url?: string;
  agency?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationWithDetails extends MediaLocation {
  // Historic prices and past campaigns tables removed in Phase 5
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
    };
  };

  return {
    locations,
    isLoading,
    createLocation,
    updateLocation,
    deleteLocation,
    uploadImage,
    getLocationWithDetails,
  };
};
