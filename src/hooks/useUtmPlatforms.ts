import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UtmPlatformRow = Database["public"]["Tables"]["utm_platforms"]["Row"];

export type UtmPlatform = UtmPlatformRow;

export const useUtmPlatforms = () => {
  return useQuery({
    queryKey: ["utm-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_platforms")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as UtmPlatform[];
    },
  });
};
