import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UtmLanguageRow = Database["public"]["Tables"]["utm_languages"]["Row"];

export type UtmLanguage = UtmLanguageRow;

export const useUtmLanguages = () => {
  return useQuery({
    queryKey: ["utm-languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_languages")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) throw error;
      return data as UtmLanguage[];
    },
  });
};
