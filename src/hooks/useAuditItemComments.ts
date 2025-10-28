import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface AuditItemComment {
  id: string;
  item_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
  };
}

export const useAuditItemComments = (itemId: string) => {
  return useQuery({
    queryKey: ["audit-item-comments", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operation_audit_item_comments")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles separately
      const authorIds = [...new Set(data.map((c) => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((comment) => ({
        ...comment,
        author: profileMap.get(comment.author_id),
      })) as AuditItemComment[];
    },
  });
};

export const useCreateAuditItemComment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      body,
      parentId,
    }: {
      itemId: string;
      body: string;
      parentId?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("operation_audit_item_comments")
        .insert({
          item_id: itemId,
          author_id: userData.user.id,
          body,
          parent_id: parentId || null,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["audit-item-comments", variables.itemId] });
      toast({
        title: "Comment added",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAuditItemComment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { error } = await supabase
        .from("operation_audit_item_comments")
        .update({ body })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-item-comments"] });
      toast({
        title: "Comment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAuditItemComment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operation_audit_item_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-item-comments"] });
      toast({
        title: "Comment deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
