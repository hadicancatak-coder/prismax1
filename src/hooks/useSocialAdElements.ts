import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface SocialAdElement {
  id: string;
  element_type: string;
  content: any;
  entity: string[];
  language?: string;
  tags?: string[];
  is_favorite: boolean;
  use_count: number;
  google_status: string;
  created_by: string;
  created_at: string;
}

export const useSocialAdElements = (elementType?: string, entity?: string[]) => {
  return useQuery({
    queryKey: ["social-ad-elements", elementType, entity],
    queryFn: async () => {
      let query = supabase
        .from("ad_elements")
        .select("*")
        .order("created_at", { ascending: false });

      if (elementType) {
        query = query.eq("element_type", elementType);
      }

      if (entity && entity.length > 0) {
        query = query.overlaps("entity", entity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialAdElement[];
    },
  });
};

export const useSaveSocialElement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      elementType,
      entity,
      language,
    }: {
      content: string;
      elementType: string;
      entity: string[];
      language?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ad_elements").insert({
        element_type: elementType,
        content: { text: content },
        entity,
        language,
        tags: [...entity, elementType],
        google_status: "pending",
        created_by: userData.user.id,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "✓ Saved to library",
        description: `Tagged with ${variables.entity.join(", ")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["social-ad-elements"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving element",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
