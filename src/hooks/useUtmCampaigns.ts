import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type UtmCampaignRow = Database["public"]["Tables"]["utm_campaigns"]["Row"];
type UtmCampaignInsert = Database["public"]["Tables"]["utm_campaigns"]["Insert"];

export type UtmCampaign = UtmCampaignRow;

export const useUtmCampaigns = () => {
  return useQuery({
    queryKey: ["utm-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("usage_count", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as UtmCampaign[];
    },
  });
};

export const useCreateUtmCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, landingPage }: { name: string; landingPage?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("utm_campaigns")
        .insert({
          name,
          landing_page: landingPage || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-campaigns"] });
      toast.success("Campaign created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create campaign: " + error.message);
    },
  });
};

export const useUpdateUtmCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, landing_page }: { id: string; name?: string; landing_page?: string | null }) => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .update({ name, landing_page })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-campaigns"] });
      toast.success("Campaign updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });
};

export const useDeleteUtmCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("utm_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-campaigns"] });
      toast.success("Campaign deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete campaign: " + error.message);
    },
  });
};
