import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VersionComment {
  id: string;
  version_id: string;
  campaign_id: string;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  comment_text: string;
  is_external: boolean;
  entity: string | null;
  created_at: string;
  updated_at: string;
}

export const useVersionComments = (versionId: string | null) => {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["version-comments", versionId],
    queryFn: async () => {
      if (!versionId) return [];
      
      const { data, error } = await supabase
        .from("utm_campaign_version_comments")
        .select("*")
        .eq("version_id", versionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VersionComment[];
    },
    enabled: !!versionId,
  });

  const createComment = useMutation({
    mutationFn: async ({
      versionId,
      campaignId,
      commentText,
      entity,
    }: {
      versionId: string;
      campaignId: string;
      commentText: string;
      entity?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("utm_campaign_version_comments")
        .insert({
          version_id: versionId,
          campaign_id: campaignId,
          author_id: user.id,
          author_name: profile?.name || "Unknown",
          author_email: profile?.email || user.email,
          comment_text: commentText,
          is_external: false,
          entity: entity || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["version-comments"] });
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("utm_campaign_version_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["version-comments"] });
      toast.success("Comment deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  return {
    comments,
    isLoading,
    createComment,
    deleteComment,
  };
};
