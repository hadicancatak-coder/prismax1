import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Visualization {
  id: string;
  user_id: string;
  dataset_id: string;
  name: string;
  description: string | null;
  viz_type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useVisualizations(datasetId?: string) {
  const queryClient = useQueryClient();

  const { data: visualizations, isLoading } = useQuery({
    queryKey: ['visualizations', datasetId],
    queryFn: async () => {
      let query = supabase
        .from('visualizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (datasetId) {
        query = query.eq('dataset_id', datasetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Visualization[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (visualization: Omit<Visualization, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('visualizations')
        .insert([{ ...visualization, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
      toast.success('Visualization created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create visualization');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Visualization> & { id: string }) => {
      const { data, error } = await supabase
        .from('visualizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
      toast.success('Visualization updated successfully');
    },
    onError: () => {
      toast.error('Failed to update visualization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('visualizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visualizations'] });
      toast.success('Visualization deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete visualization');
    },
  });

  return {
    visualizations,
    isLoading,
    createVisualization: createMutation.mutate,
    updateVisualization: updateMutation.mutate,
    deleteVisualization: deleteMutation.mutate,
  };
}
