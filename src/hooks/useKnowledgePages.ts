import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KnowledgePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  icon: string;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  children?: KnowledgePage[];
}

export function useKnowledgePages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["knowledge-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_pages")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as KnowledgePage[];
    },
  });

  // Build tree structure from flat list
  const buildTree = (items: KnowledgePage[]): KnowledgePage[] => {
    const map = new Map<string, KnowledgePage>();
    const roots: KnowledgePage[] = [];

    items.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const pageTree = pages ? buildTree(pages) : [];

  const createPage = useMutation({
    mutationFn: async (data: { title: string; content?: string; parent_id?: string | null; icon?: string }) => {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newPage, error } = await supabase
        .from("knowledge_pages")
        .insert({
          title: data.title,
          slug,
          content: data.content || '',
          parent_id: data.parent_id || null,
          icon: data.icon || 'file-text',
        })
        .select()
        .single();
      
      if (error) throw error;
      return newPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast({ title: "Page created" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create page", description: error.message, variant: "destructive" });
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string; parent_id?: string | null; icon?: string }) => {
      const updateData: any = { ...data };
      if (data.title) {
        updateData.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      const { data: updated, error } = await supabase
        .from("knowledge_pages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast({ title: "Page updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update page", description: error.message, variant: "destructive" });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_pages")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-pages"] });
      toast({ title: "Page deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete page", description: error.message, variant: "destructive" });
    },
  });

  return {
    pages,
    pageTree,
    isLoading,
    createPage,
    updatePage,
    deletePage,
  };
}
